"use client";
import { Check, CircleCheckFill, Globe, Xmark } from "@gravity-ui/icons";
import {
  Button,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Modal,
  NumberField,
  Select,
  Spinner,
  Surface,
  Switch,
  TextArea,
  TextField,
  toast,
  type UseOverlayStateReturn
} from "@heroui/react";
import { useRequest } from "ahooks";
import { type Dispatch, type FC, type FormEvent, type SetStateAction, useEffect, useRef, useState } from 'react';

import TagInputs from "@/components/ui/tag-inputs";
import { RESPONSE } from '@/enums';
import { get } from '@/lib/utils'
import { addWebsite, updateWebsite } from '@/services/websites';

const SwitchOptions: { name: string, label: string }[] = [
  { name: 'pinned', label: '置顶' },
  { name: 'vpn', label: 'VPN' },
  { name: 'recommend', label: '推荐' },
  { name: 'commonlyUsed', label: '常用' }
]

type SaveModalProps = {
  state: UseOverlayStateReturn;
  initialValues: App.Website | null;
  handleRefresh: VoidFunction;
  tags: string[];
  setTags: Dispatch<SetStateAction<string[]>>;
  categorysList: App.Category[];
}

const SaveModal: FC<SaveModalProps> = ({
  state,
  initialValues,
  handleRefresh,
  tags = [],
  setTags,
  categorysList = [],
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const actionText = initialValues ? '编辑' : '新增';

  // 用 React state 管理名称和描述（支持自动填充）
  const [name, setName] = useState(initialValues?.name ?? '');
  const [desc, setDesc] = useState(initialValues?.desc ?? '');
  // 追踪用户是否手动编辑过（编辑过就不再自动覆盖）
  const nameEditedRef = useRef(!!initialValues?.name);
  const descEditedRef = useRef(!!initialValues?.desc);

  // 输入网址时防抖自动获取标题和描述
  const metadataTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);
  const handleUrlChange = (value: string) => {
    clearTimeout(metadataTimerRef.current)
    if (!value || !/^https:\/\//.test(value)) return
    if (nameEditedRef.current && descEditedRef.current) return

    metadataTimerRef.current = setTimeout(() => {
      fetch('/api/websites/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: value }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (!mountedRef.current) return
          if (json.code === 200 && json.data) {
            const { title, description } = json.data
            if (title && !nameEditedRef.current) {
              setName(title)
            }
            if (description && !descEditedRef.current) {
              setDesc(description)
            }
          }
        })
        .catch(() => {})
    }, 600)
  }

  // 保存表单
  const { loading, run } = useRequest(initialValues?.id ? updateWebsite : addWebsite, {
    manual: true,
    onSuccess: ({ code, data }) => {
      if (code === RESPONSE.SUCCESS) {
        // 新建且没有手动设置 logo，自动获取 favicon
        if (data?.id && !initialValues) {
          state.close();
          toast.success("提交成功", { timeout: 2000, indicator: <CircleCheckFill /> });
          handleRefresh?.();
          fetch(`/api/websites/${data.id}/favicon`, { method: 'POST' }).finally(() => handleRefresh?.());
        } else {
          state.close();
          toast.success("提交成功", { timeout: 2000, indicator: <CircleCheckFill /> });
          handleRefresh?.();
        }
      }
    },
  });

  // url
  const validateUrl = (value: string) => {
    if (!value) {
      return "请输入网站链接";
    }

    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return "请输入合法的 URL";
    }

    if (url.protocol !== "https:") {
      return "网站链接必须以 https:// 开头";
    }

    const hostname = url.hostname;

    const isIP =
      /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) ||
      /^\[[0-9a-fA-F:]+\]$/.test(hostname);

    const hasDot = hostname.includes(".");

    if (!hasDot && !isIP) {
      return "请输入有效的域名（如 https://example.com）";
    }

    return null;
  }

  // 表单提交
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: App.WebsiteSaveParams = {
      id: initialValues?.id,

      category_id: formData.get("category_id") as string,
      name,
      desc: desc || "",
      url: formData.get("url") as string,
      logo: formData.get("logo") as string,
      logoAccent: formData.get("logoAccent") as string,

      sort: Number(formData.get("sort")),

      pinned: formData.has("pinned"),
      vpn: formData.has("vpn"),
      recommend: formData.has("recommend"),
      commonlyUsed: formData.has("commonlyUsed"),

      tags
    };
    run({ ...data, id: initialValues?.id, tags });
  };

  useEffect(() => {
    if (!state.isOpen && formRef.current) {
      formRef.current.reset();
      setName('');
      setDesc('');
      nameEditedRef.current = false;
      descEditedRef.current = false;
      clearTimeout(metadataTimerRef.current);
      mountedRef.current = false;
      setTags([]);
    }
  }, [state.isOpen, setTags]);

  // 打开弹窗时同步初始值（编辑模式）
  useEffect(() => {
    if (state.isOpen) {
      mountedRef.current = true;
      setName(initialValues?.name ?? '');
      setDesc(initialValues?.desc ?? '');
      nameEditedRef.current = !!initialValues?.name;
      descEditedRef.current = !!initialValues?.desc;
    }
  }, [state.isOpen, initialValues]);
  return (
    <Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen} isDismissable={false} isKeyboardDismissDisabled>
      <Modal.Container placement="auto">
        <Modal.Dialog className="sm:max-w-lg">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
              <Globe className="size-5" />
            </Modal.Icon>
            <Modal.Heading>{`${actionText}网站`}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="py-4 px-1">
            <Surface variant="default">
              <Form ref={formRef} id="category-form" className="flex flex-col gap-4" onSubmit={onSubmit}>
                <Select
                  name='category_id'
                  isRequired
                  aria-label='所属分类'
                  placeholder="请选择所属分类"
                  variant='secondary'
                  defaultValue={initialValues?.category_id ?? ""}
                >
                  <Label>所属分类</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {categorysList?.map(({ id, name }) => (
                        <ListBox.Item key={id} id={id} textValue={name}>
                          {name}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
                <TextField
                  isRequired
                  name="url"
                  minLength={1}
                  defaultValue={initialValues?.url ?? ""}
                  validate={validateUrl}
                >
                  <Label>网站链接</Label>
                  <Input aria-label="网站链接" fullWidth variant="secondary" placeholder="请输入网站链接" onChange={(e) => handleUrlChange(e.target.value)} />
                  <FieldError />
                </TextField>
                <TextField
                  isRequired
                  name="name"
                  minLength={1}
                  maxLength={100}
                  value={name}
                  onChange={(e) => {
                    if (!e?.target) return
                    setName(e.target.value)
                    nameEditedRef.current = true
                  }}
                  validate={(value) => {
                    if (!value) {
                      return "请输入网站名称";
                    }
                    return null;
                  }}
                >
                  <Label>网站名称</Label>
                  <Input aria-label="网站名称" fullWidth variant="secondary" placeholder="请输入网站名称" />
                  <FieldError />
                </TextField>
                <TextField name="logo" defaultValue={initialValues?.logo ?? ''}>
                  <Label>Logo</Label>
                  <Input aria-label="Logo URL" fullWidth variant="secondary" placeholder="https://... 或留空自动获取" />
                  <Description>填入图标 URL，留空则在添加时自动获取网站 favicon。</Description>
                </TextField>
                <TextField name="logoAccent" defaultValue={initialValues?.logoAccent ?? ""}>
                  <Label>Logo 主色</Label>
                  <Input aria-label="Logo 主色" fullWidth variant="secondary" placeholder="请输入 Logo 主色" />
                  <Description>用于显示边框动画，不设置默认主题色。</Description>
                </TextField>
                <TagInputs value={tags} onChange={setTags} />
                <TextField name="desc" maxLength={500} value={desc}
                  onChange={(e) => {
                    if (!e?.target) return
                    setDesc(e.target.value)
                    descEditedRef.current = true
                  }}>
                  <Label>网站描述</Label>
                  <TextArea aria-label="网站描述" fullWidth variant="secondary" rows={3} placeholder="请输入网站描述" />
                </TextField>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="tags">网站属性</Label>
                  <div className="grid grid-cols-4 items-center gap-4">
                    {SwitchOptions.map(({ name, label }) => (
                      <Switch key={name} name={name} defaultSelected={get(initialValues, name, false)} value="on">
                        {({ isSelected }) => (
                          <>
                            <Label className="text-sm">{label}</Label>
                            <Switch.Control>
                              <Switch.Thumb>
                                <Switch.Icon>
                                  {isSelected ? (
                                    <Check className="size-3 text-inherit opacity-100" />
                                  ) : (
                                    <Xmark className="size-3 text-inherit opacity-70" />
                                  )}
                                </Switch.Icon>
                              </Switch.Thumb>
                            </Switch.Control>
                          </>
                        )}
                      </Switch>
                    ))}
                  </div>
                </div>
                <TextField
                  isRequired
                  validate={(value) => {
                    if (!value) return "请输入排序";
                    return null;
                  }}
                  name="sort"
                  defaultValue={String(initialValues?.sort ?? 1)}
                  variant="secondary"
                >
                  <Label>排序</Label>
                  <Input type="number" aria-label="排序" fullWidth variant="secondary" />
                </TextField>
              </Form>
            </Surface>
          </Modal.Body>
          <Modal.Footer>
            <Button slot="close" variant="outline" isDisabled={loading}>
              取消
            </Button>
            <Button type="submit" form="category-form" isPending={loading}>
              {({ isPending }) => (
                <>
                  {isPending ? <Spinner color="current" size="sm" /> : null}
                  {isPending ? "正在提交..." : "确定"}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
export default SaveModal;
