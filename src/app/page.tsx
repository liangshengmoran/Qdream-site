/*
 * @Author: 白雾茫茫丶<baiwumm.com>
 * @Date: 2026-01-21 16:33:59
 * @LastEditors: QingYun
 * @LastEditTime: 2026-03-09 17:11:14
 * @Description: 首页
 */
"use client";
import { useRequest } from 'ahooks';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { Lock } from '@gravity-ui/icons';

import AlertContent from '@/components/AlertContent';
import BlurFade from '@/components/BlurFade';
import CategoryNav from '@/components/CategoryNav';
import LoadingContent from '@/components/LoadingContent';
import WebsiteCard from '@/components/WebSiteCard';
import { get } from '@/lib/utils';

export default function Home() {
  const router = useRouter();

  const { data = [] as App.Category[], loading, error, run } = useRequest(
    async () => {
      const showPrivate = typeof window !== 'undefined' ? localStorage.getItem('show-private-categories') !== '0' : false
      const res = await fetch(`/api/categorys?tree=1&pageIndex=0&pageSize=999&showPrivate=${showPrivate ? '1' : '0'}`);
      const json = await res.json();
      return get(json, 'data', []);
    },
  );

  // 监听隐私显示切换
  useEffect(() => {
    const handler = () => run()
    window.addEventListener('privacy-toggle', handler)
    return () => window.removeEventListener('privacy-toggle', handler)
  }, [run])

  const reload = () => {
    run();
  };

  const goAdmin = () => {
    router.push('/admin');
  };

  const handleClick = useCallback(async (id: string) => {
    fetch(`/api/websites/${id}/visit`, { method: 'POST' }).catch(() => {});
  }, []);

  const renderCategory = useCallback((cat: App.Category, index: number, depth = 0) => {
    const { id, name, websites, children } = cat
    return (
      <BlurFade key={id} inView delay={index * 0.04} className="flex flex-col gap-2">
        <div data-category-id={id} className="scroll-mt-20">
          <h1 className={(depth === 0 ? "text-xl font-black" : depth === 1 ? "text-lg font-bold" : "text-base font-semibold") + " flex items-center gap-1"}>
            {name}
            {cat.private && <Lock className="size-4 text-danger" title="隐私分类" />}
          </h1>
        </div>
        {websites?.length ? (
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]">
            {websites.map((item, idx) => (
              <motion.div
                key={item.id}
                variants={{
                  hidden: { y: 20, opacity: 0, filter: 'blur(6px)' },
                  visible: { y: 0, opacity: 1, filter: 'none' }
                }}
                transition={{ delay: 0.04 * idx, duration: 0.4, ease: "easeOut" }}
              >
                <WebsiteCard data={item} handleClick={handleClick} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center p-4">
            <AlertContent
              status="accent"
              title="暂无网站数据"
              description="该分类还没有任何网站，请前往后台进行添加。"
              actionText="添加网站"
              buttonAction={goAdmin}
            />
          </div>
        )}
        {children?.map((child, ci) => renderCategory(child, index + ci + 1, depth + 1))}
      </BlurFade>
    );
  }, [handleClick, goAdmin]);

  if (loading) {
    return (
      <div className="w-full flex-1 flex justify-center items-center">
        <LoadingContent text='正在加载，请稍后...' />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex-1 flex justify-center items-center">
        <AlertContent
          status="danger"
          title="请求失败"
          description="服务暂时不可用，请稍后重试。"
          actionText="重新加载"
          buttonVariant="danger"
          buttonAction={reload}
        />
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="w-full flex-1 flex justify-center items-center">
        <AlertContent
          status="accent"
          title="暂无分类数据"
          description="当前还没有任何分类，请前往后台进行添加。"
          actionText="添加分类"
          buttonAction={goAdmin}
        />
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      <CategoryNav categories={data} />
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {data.map((cat, index) => renderCategory(cat, index))}
      </div>
    </div>
  );
}
