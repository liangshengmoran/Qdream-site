"use client";
import { Check, Envelope, Eye, EyeSlash, Lock } from '@gravity-ui/icons';
import { Button, Card, Description, FieldError, Form, Input, InputGroup, Label, Separator, Spinner, TextField, toast } from '@heroui/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

export default function Setup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (json.code === 200) {
        toast.success('管理员账号创建成功！', { timeout: 2000 });
        router.push('/admin');
      } else {
        toast.danger(json.msg || '创建失败', { timeout: 3000 });
      }
    } catch {
      toast.danger('创建失败', { timeout: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center flex-1">
      <Card className="w-lg max-w-md shadow-md">
        <Card.Header>
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" width={42} height={42} alt="Logo" className="rounded-lg" />
            <div className="flex flex-col">
              <p className="text-lg font-bold">{process.env.NEXT_PUBLIC_APP_NAME}</p>
              <Description>首次使用，请创建管理员账号</Description>
            </div>
          </div>
        </Card.Header>
        <Separator />
        <Card.Content>
          <Form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <TextField
              isRequired
              name="email"
              type="email"
              validate={(value) => {
                if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
                  return "请输入合法的邮箱地址!";
                }
                return null;
              }}
            >
              <Label>管理员邮箱</Label>
              <InputGroup variant="secondary">
                <InputGroup.Prefix><Envelope className="size-4 text-muted" /></InputGroup.Prefix>
                <InputGroup.Input aria-label="Email" placeholder="请输入邮箱地址" />
              </InputGroup>
              <FieldError />
            </TextField>
            <TextField
              isRequired
              minLength={6}
              name="password"
              type="password"
              validate={(value) => {
                if (value.length < 6) return "密码长度至少6位";
                return null;
              }}
            >
              <Label>管理员密码</Label>
              <InputGroup variant="secondary">
                <InputGroup.Prefix><Lock className="size-4 text-muted" /></InputGroup.Prefix>
                <InputGroup.Input type={showPassword ? 'text' : 'password'} aria-label="Password" placeholder="请输入密码" />
                <InputGroup.Suffix className="pr-0">
                  <Button isIconOnly aria-label="切换密码可见" size="sm" variant="ghost" onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <Eye className="size-4" /> : <EyeSlash className="size-4" />}
                  </Button>
                </InputGroup.Suffix>
              </InputGroup>
              <Description>请牢记此账号密码，这是唯一的后台管理员账号。</Description>
              <FieldError />
            </TextField>
            <Button type="submit" isDisabled={loading} isPending={loading} className="w-full">
              {({ isPending }) => (
                <>{isPending ? <Spinner color="current" size="sm" /> : <Check />}{isPending ? '创建中...' : '创建管理员账号'}</>
              )}
            </Button>
          </Form>
        </Card.Content>
      </Card>
    </div>
  )
}
