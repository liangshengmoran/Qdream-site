"use client";
import { CircleCheckFill, Folder } from "@gravity-ui/icons";
import { Button, Description, FieldError, Form, Input, Label, Modal, Spinner, Surface, Switch, TextField, toast, type UseOverlayStateReturn } from "@heroui/react";
import { useRequest } from "ahooks";
import { type FC, type FormEvent, useEffect, useRef, useState } from 'react';

import { RESPONSE } from '@/enums';
import { get } from '@/lib/utils';
import { addCategory, updateCategory } from '@/services/categorys';

type SaveModalProps = {
  state: UseOverlayStateReturn;
  initialValues: App.Category | null;
  handleRefresh: VoidFunction;
  allCategories: App.Category[];
}

const SaveModal: FC<SaveModalProps> = ({ state, initialValues, handleRefresh, allCategories = [] }) => {
  const formRef = useRef<HTMLFormElement>(null);
  const actionText = initialValues ? '编辑' : '新增';

  // 父级分类选项（排除自己和自己的子分类）
  const parentOptions = allCategories.filter((c) => {
    if (!initialValues) return true
    if (c.id === initialValues.id) return false
    // 简化的循环检测：只排除自身
    return c.parent_id !== initialValues.id
  })

  const [isPrivate, setIsPrivate] = useState(initialValues?.private ?? false);
  const [parentId, setParentId] = useState<string>(initialValues?.parent_id ?? '');

  const { loading, run } = useRequest(initialValues?.id ? updateCategory : addCategory, {
    manual: true,
    onSuccess: ({ code }) => {
      if (code === RESPONSE.SUCCESS) {
        state.close();
        toast.success("提交成功", { timeout: 2000, indicator: <CircleCheckFill /> });
        handleRefresh?.();
      }
    },
  });

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: App.CategorySaveParams = {
      name: formData.get("name") as string,
      sort: Number(formData.get("sort")),
      private: isPrivate,
      parent_id: parentId || null,
      id: initialValues?.id,
    };
    run(data);
  };

  useEffect(() => {
    if (!state.isOpen && formRef.current) {
      formRef.current.reset();
      setIsPrivate(false);
      setParentId('');
    }
  }, [state.isOpen]);

  useEffect(() => {
    if (state.isOpen) {
      setIsPrivate(initialValues?.private ?? false);
      setParentId(initialValues?.parent_id ?? '');
    }
  }, [state.isOpen, initialValues]);

  return (
    <Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
      <Modal.Container placement="auto">
        <Modal.Dialog className="sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
              <Folder className="size-5" />
            </Modal.Icon>
            <Modal.Heading>{`${actionText}分类`}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="py-4 px-1">
            <Surface variant="default">
              <Form ref={formRef} id="category-form" className="flex flex-col gap-4" onSubmit={onSubmit}>
                <TextField
                  isRequired
                  name="name"
                  minLength={1}
                  maxLength={100}
                  defaultValue={initialValues?.name ?? ""}
                  validate={(value) => {
                    if (!value) return "请输入分类名称";
                    return null;
                  }}
                >
                  <Label>分类名称</Label>
                  <Input aria-label="Name" fullWidth variant="secondary" placeholder="请输入分类名称" />
                  <FieldError />
                </TextField>
                <div className="flex flex-col gap-1">
                  <Label>父级分类</Label>
                  <select
                    className="w-full rounded-lg border border-muted-foreground/20 bg-muted/30 px-3 py-2 text-sm outline-none focus:border-accent"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                  >
                    <option value="">无（顶级分类）</option>
                    {parentOptions.map(({ id, name }) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                  <Description>选择后该分类将成为子分类。</Description>
                </div>
                <TextField
                  isRequired
                  validate={(value) => { if (!value) return "请输入排序"; return null; }}
                  name="sort"
                  defaultValue={String(initialValues?.sort ?? 1)}
                  variant="secondary"
                >
                  <Label>排序</Label>
                  <Input type="number" aria-label="排序" fullWidth variant="secondary" />
                </TextField>
                <div className="flex flex-col gap-1">
                  <Switch
                    key={state.isOpen ? 'open' : 'closed'}
                    defaultSelected={initialValues?.private ?? false}
                    value="on"
                    onChange={setIsPrivate}
                  >
                    {({ isSelected }) => (
                      <>
                        <Label>隐私模式</Label>
                        <Switch.Control>
                          <Switch.Thumb>
                            <Switch.Icon />
                          </Switch.Thumb>
                        </Switch.Control>
                      </>
                    )}
                  </Switch>
                  <Description>开启后未登录用户不可见该分类。</Description>
                </div>
              </Form>
            </Surface>
          </Modal.Body>
          <Modal.Footer>
            <Button slot="close" variant="outline" isDisabled={loading}>取消</Button>
            <Button type="submit" form="category-form" isPending={loading}>
              {({ isPending }) => (
                <>{isPending ? <Spinner color="current" size="sm" /> : null}{isPending ? "正在提交..." : "确定"}</>
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
export default SaveModal;
