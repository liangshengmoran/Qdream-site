/*
 * @Author: QingYun
 * @Description: 管理后台
 */
"use client"
import { Folder, Gear, Globe } from "@gravity-ui/icons";
import { Tabs } from "@heroui/react";
import { useRouter } from 'next/navigation';
import { type FC, useEffect } from 'react';

import Categorys from './components/categorys'
import Websites from './components/websites'
import Settings from './components/settings'

import { ADMIN_TABS } from '@/enums';

const Admin: FC = () => {
  const router = useRouter()

  // 切回标签页时重新验证登录态
  useEffect(() => {
    const check = () => {
      fetch('/api/auth/me').then(r => r.json()).then(d => {
        if (d.code !== 200) router.replace('/login')
      }).catch(() => {})
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
    return () => document.removeEventListener('visibilitychange', check)
  }, [router])

  return (
    <Tabs>
      <Tabs.ListContainer>
        <Tabs.List aria-label="后台管理">
          <Tabs.Tab id={ADMIN_TABS.CATEGOTYS} className="flex items-center gap-1">
            <Folder />{ADMIN_TABS.label(ADMIN_TABS.CATEGOTYS)}<Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id={ADMIN_TABS.WEBSITES} className="flex items-center gap-1">
            <Globe />{ADMIN_TABS.label(ADMIN_TABS.WEBSITES)}<Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id={ADMIN_TABS.SETTINGS} className="flex items-center gap-1">
            <Gear />{ADMIN_TABS.label(ADMIN_TABS.SETTINGS)}<Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel id={ADMIN_TABS.CATEGOTYS}><Categorys /></Tabs.Panel>
      <Tabs.Panel id={ADMIN_TABS.WEBSITES}><Websites /></Tabs.Panel>
      <Tabs.Panel id={ADMIN_TABS.SETTINGS}><Settings /></Tabs.Panel>
    </Tabs>
  )
}
export default Admin;
