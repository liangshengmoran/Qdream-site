"use client";
import { CircleCheckFill, Gear } from "@gravity-ui/icons";
import { Button, Card, Description, FieldError, Form, Input, Label, Separator, Spinner, Surface, TextArea, TextField, toast } from "@heroui/react";
import { useRequest } from "ahooks";
import Image from "next/image";
import { type FC, type FormEvent, useEffect, useRef, useState } from "react";

import { RESPONSE } from '@/enums';

const Settings: FC = () => {
  const formRef = useRef<HTMLFormElement>(null);

  const { data: settings, loading, run: reload } = useRequest(
    async () => {
      const res = await fetch('/api/settings');
      const json = await res.json();
      return (json.code === 200 ? json.data : {}) as Record<string, string>;
    }
  );

  const { loading: saving, run: save } = useRequest(
    async (body: Record<string, string>) => {
      const res = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      return res.json();
    },
    { manual: true, onSuccess: ({ code }) => { if (code === 200) { toast.success("保存成功", { timeout: 2000, indicator: <CircleCheckFill /> }); reload(); } } }
  );

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    fd.forEach((v, k) => { if (k.startsWith('setting_')) { data[k.replace('setting_', '')] = v.toString(); } });
    save(data);
  };

  const defaultValue = (key: string) => settings?.[key] || '';

  // Admin profile
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ email?: string; name?: string | null }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载当前用户信息
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.code === 200 && d.data) {
        if (d.data.avatar_url) setAvatarPreview(d.data.avatar_url);
        setUserInfo({ email: d.data.email, name: d.data.name });
      }
    }).catch(() => {});
  }, []);

  const handleProfileSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setProfileSaving(true);
    try {
      const res = await fetch('/api/auth/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: fd.get('name'), email: fd.get('email') }) });
      const json = await res.json();
      if (json.code === 200) {
        toast.success("管理员信息已更新", { timeout: 2000 });
        setUserInfo({ email: fd.get('email') as string, name: fd.get('name') as string });
      }
      else toast.danger(json.msg || "更新失败", { timeout: 3000 });
    } catch { toast.danger("更新失败", { timeout: 3000 }); }
    finally { setProfileSaving(false); }
  };

  const handlePasswordChange = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const current = fd.get('current_password') as string;
    const newPwd = fd.get('new_password') as string;
    if (!current || !newPwd) { toast.danger("请填写完整", { timeout: 2000 }); return; }
    setProfileSaving(true);
    try {
      const res = await fetch('/api/auth/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: current, newPassword: newPwd }) });
      const json = await res.json();
      if (json.code === 200) { toast.success("密码已修改", { timeout: 2000 }); (e.target as HTMLFormElement).reset(); }
      else toast.danger(json.msg || "修改失败", { timeout: 3000 });
    } catch { toast.danger("修改失败", { timeout: 3000 }); }
    finally { setProfileSaving(false); }
  };

  if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

  const inputProps = (name: string) => ({ name: `setting_${name}`, defaultValue: defaultValue(name) });

  return (
    <div className="flex flex-col gap-4">
      {/* 站点设置 */}
      <Card className="shadow-lg">
        <Card.Header>
          <Card.Title className="flex items-center gap-2"><Gear className="size-5" />站点信息</Card.Title>
        </Card.Header>
        <Card.Content className="max-h-[calc(100vh-280px)] overflow-y-auto">
          <Form ref={formRef} id="settings-form" className="flex flex-col gap-6" onSubmit={onSubmit} key={JSON.stringify(settings)}>
            <Surface variant="default" className="p-4 flex flex-col gap-4">
              <h3 className="text-sm font-bold">基本信息</h3>
              <TextField {...inputProps('app_name')}><Label>网站名称</Label><Input variant="secondary" /></TextField>
              <TextField {...inputProps('app_desc')}><Label>网站描述</Label><TextArea variant="secondary" rows={2} /></TextField>
              <TextField {...inputProps('app_keywords')}><Label>SEO 关键词</Label><Input variant="secondary" /></TextField>
              <TextField {...inputProps('app_url')}><Label>网站地址</Label><Input variant="secondary" /></TextField>
              <TextField {...inputProps('site_logo')}><Label>网站 Logo</Label><Input variant="secondary" placeholder="/logo.svg" /><Description>填入图片路径，如 /logo.svg。</Description></TextField>
            </Surface>
            <Surface variant="default" className="p-4 flex flex-col gap-4">
              <h3 className="text-sm font-bold">SEO / 分析</h3>
              <TextField {...inputProps('umami_id')}><Label>Umami ID</Label><Input variant="secondary" /><Description>留空则不加载。</Description></TextField>
              <TextField {...inputProps('google_id')}><Label>Google Analytics ID</Label><Input variant="secondary" /><Description>留空则不加载。</Description></TextField>
              <TextField {...inputProps('clarity_id')}><Label>Microsoft Clarity ID</Label><Input variant="secondary" /><Description>留空则不加载。</Description></TextField>
            </Surface>
            <Surface variant="default" className="p-4 flex flex-col gap-4">
              <h3 className="text-sm font-bold">导航栏按钮</h3>
              <TextField {...inputProps('github_url')}><Label>GitHub 链接</Label><Input variant="secondary" /><Description>留空则隐藏 GitHub 按钮。</Description></TextField>
              <TextField {...inputProps('blog_url')}><Label>博客链接</Label><Input variant="secondary" /><Description>留空则隐藏博客按钮。</Description></TextField>
            </Surface>
            <Surface variant="default" className="p-4 flex flex-col gap-4">
              <h3 className="text-sm font-bold">页脚信息</h3>
              <TextField {...inputProps('copyright')}><Label>版权信息</Label><Input variant="secondary" /></TextField>
              <TextField {...inputProps('copyright_url')}><Label>版权链接</Label><Input variant="secondary" /><Description>点击版权文字跳转的链接地址。</Description></TextField>
              <TextField {...inputProps('icp')}><Label>ICP 备案号</Label><Input variant="secondary" /><Description>留空则不显示。</Description></TextField>
              <TextField {...inputProps('guan_icp')}><Label>公网备案号</Label><Input variant="secondary" /><Description>留空则不显示。</Description></TextField>
            </Surface>
          </Form>
        </Card.Content>
        <Card.Footer className="px-4">
          <Button type="submit" form="settings-form" isPending={saving}>
            {({ isPending }) => <>{isPending ? <Spinner color="current" size="sm" /> : null}{isPending ? "保存中..." : "保存设置"}</>}
          </Button>
        </Card.Footer>
      </Card>

      {/* 管理员信息 */}
      <Card className="shadow-lg">
        <Card.Header><Card.Title className="flex items-center gap-2"><Gear className="size-5" />管理员信息</Card.Title></Card.Header>
        <Card.Content className="flex flex-col gap-6">
          {/* 头像 */}
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file" name="avatar" accept="image/*" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setAvatarPreview(URL.createObjectURL(file));
                  // 自动提交
                  const fd = new FormData();
                  fd.append('file', file);
                  setAvatarUploading(true);
                  fetch('/api/auth/avatar', { method: 'POST', body: fd })
                    .then(r => r.json())
                    .then(json => {
                      if (json.code === 200) { setAvatarPreview(json.data.avatar_url); toast.success("头像已更新", { timeout: 2000 }); }
                      else toast.danger(json.msg || "上传失败", { timeout: 3000 });
                    })
                    .catch(() => toast.danger("上传失败", { timeout: 3000 }))
                    .finally(() => setAvatarUploading(false));
                }
              }}
            />
            <div
              className="size-16 rounded-full border-2 border-dashed border-muted-foreground/25 hover:border-accent cursor-pointer flex items-center justify-center overflow-hidden transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <Image src={avatarPreview} width={64} height={64} alt="头像" className="object-cover" unoptimized />
              ) : (
                <span className="text-muted-foreground text-xs">{avatarUploading ? '上传中...' : '点击上传'}</span>
              )}
            </div>
            {avatarUploading && <Spinner size="sm" />}
          </div>
          <Separator />
          {/* 基本信息 */}
          <Form key={JSON.stringify(userInfo)} className="flex flex-col gap-4" onSubmit={handleProfileSave}>
            <TextField name="name" defaultValue={userInfo.name || ''}><Label>昵称</Label><Input variant="secondary" placeholder="管理员昵称" /></TextField>
            <TextField name="email" isRequired defaultValue={userInfo.email || ''}><Label>登录邮箱</Label><Input variant="secondary" type="email" /></TextField>
            <div><Button type="submit" size="sm" isPending={profileSaving}>{profileSaving ? '保存中...' : '保存'}</Button></div>
          </Form>
          <Separator />
          {/* 修改密码 */}
          <Form className="flex flex-col gap-4" onSubmit={handlePasswordChange}>
            <TextField name="current_password" isRequired><Label>当前密码</Label><Input variant="secondary" type="password" /></TextField>
            <TextField name="new_password" isRequired><Label>新密码</Label><Input variant="secondary" type="password" /><Description>长度至少6位。</Description></TextField>
            <div><Button type="submit" size="sm" variant="outline" className="text-danger" isPending={profileSaving}>{profileSaving ? '修改中...' : '修改密码'}</Button></div>
          </Form>
        </Card.Content>
      </Card>
    </div>
  );
};

export default Settings;
