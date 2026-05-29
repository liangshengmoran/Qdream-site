/*
 * @Author: 白雾茫茫丶<baiwumm.com>
 * @Date: 2026-01-22 15:44:57
 * @LastEditors: QingYun
 * @LastEditTime: 2026-03-11 13:39:15
 * @Description: 用户头像
 */
import { useRouter } from '@bprogress/next/app';
import { ArrowRightFromSquare, Eye, EyeSlash, GearDot, Person } from '@gravity-ui/icons';
import { AlertDialog, Avatar, Badge, Button, Description, Dropdown, Label, Separator, Spinner, Tooltip, useOverlayState } from '@heroui/react';
import { type FC, type Key, useEffect, useState } from 'react';

import { useUser } from '@/hooks/use-user';

const STORAGE_KEY = 'show-private-categories'

const UserAvatar: FC = () => {
  const router = useRouter();
  const { user, loading } = useUser();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const alertState = useOverlayState();
  const [showPrivate, setShowPrivate] = useState(true);

  useEffect(() => {
    setShowPrivate(localStorage.getItem(STORAGE_KEY) !== '0')
  }, [])
  const name = user?.name || user?.email?.slice(0, 1);
  const avatar = user?.avatar_url as string;

  const togglePrivate = () => {
    const next = !showPrivate
    setShowPrivate(next)
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
    window.dispatchEvent(new CustomEvent('privacy-toggle', { detail: next }))
  }

  const onClickMenu = (key: Key) => {
    switch (key) {
      case 'admin':
        router.push('/admin');
        break;
      case 'logout':
        setOpen(false);
        setTimeout(() => {
          alertState.open();
        }, 500)
        break;
    }
  }

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      alertState.close();
      router.push('/login');
    } finally {
      setLogoutLoading(false);
    }
  }

  return loading ? (
    <Spinner size='sm' />
  ) : user ? (
    <>
      <Dropdown isOpen={open} onOpenChange={setOpen}>
        <Dropdown.Trigger>
          <Badge.Anchor>
            <Avatar className="size-8">
              <Avatar.Image alt="在线用户" src={avatar} />
              <Avatar.Fallback>
                <Person />
              </Avatar.Fallback>
            </Avatar>
            <Badge color="success" placement="bottom-right" size="sm" className="rounded-full min-h-3 min-w-3" />
          </Badge.Anchor>
        </Dropdown.Trigger>
        <Dropdown.Popover>
          <div className="flex items-center gap-3 p-3">
            <Avatar size="sm">
              <Avatar.Image alt="在线用户" src={avatar} />
              <Avatar.Fallback>
                <Person />
              </Avatar.Fallback>
            </Avatar>
            <div className="flex flex-col space-y-1 min-w-0">
              <p className="font-black">{name}</p>
              <Description className="truncate">
                {user?.email}
              </Description>
            </div>
          </div>
          <Separator />
          <Dropdown.Menu className="font-normal" onAction={onClickMenu}>
            <Dropdown.Item id="admin" textValue="Admin">
              <GearDot className="size-4 shrink-0 text-muted" />
              <Label>管理后台</Label>
            </Dropdown.Item>
            <Dropdown.Item id="privacy" textValue="Privacy" onAction={togglePrivate}>
              {showPrivate ? <Eye className="size-4 shrink-0" /> : <EyeSlash className="size-4 shrink-0" />}
              <Label>{showPrivate ? '隐藏隐私书签' : '显示隐私书签'}</Label>
            </Dropdown.Item>
            <Dropdown.Item id="logout" textValue="Logout" variant="danger">
              <ArrowRightFromSquare className="size-4 shrink-0 text-danger" />
              <Label>退出登录</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      <AlertDialog.Backdrop isOpen={alertState.isOpen} onOpenChange={alertState.setOpen}>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-100">
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>温馨提示</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              确定要退出登录吗？
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary">
                取消
              </Button>
              <Button variant="danger" isPending={logoutLoading} onPress={() => handleLogout()}>
                {({ isPending }) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : null}
                    {isPending ? '正在退出...' : '确认注销'}
                  </>
                )}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </>
  ) : (
    <Tooltip>
      <Button variant="outline" isIconOnly size='sm' className="rounded-full" onClick={() => router.push('/login')}>
        <Person />
      </Button>
      <Tooltip.Content showArrow>
        <Tooltip.Arrow />
        登录
      </Tooltip.Content>
    </Tooltip>
  )
}
export default UserAvatar;
