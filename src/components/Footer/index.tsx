/*
 * @Description: 底部版权
 */
import { Description, Separator } from "@heroui/react";
import dayjs from 'dayjs';
import Image from 'next/image';
import { type FC, type ReactNode, useMemo } from 'react';

import { ShimmeringText } from '@/components/ShimmeringText';
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import { useSettings } from '@/hooks/use-settings';
import pkg from '#/package.json';

type IcpItem = {
  image: string;
  url: string;
  label: string;
}

const Footer: FC = () => {
  const settings = useSettings();
  const loaded = settings !== null;
  const appName = loaded ? (settings.app_name || process.env.NEXT_PUBLIC_APP_NAME || 'Dream Site') : '';
  const copyright = loaded ? (settings.copyright || process.env.NEXT_PUBLIC_COPYRIGHT || '') : '';
  const copyrightUrl = loaded ? (settings.copyright_url || pkg.author.url) : '#';

  const icpLinks: IcpItem[] = useMemo(() => {
    if (!loaded) return [];
    const items: IcpItem[] = [];
    const icp = settings.icp || process.env.NEXT_PUBLIC_ICP;
    const guan = settings.guan_icp || process.env.NEXT_PUBLIC_GUAN_ICP;
    if (icp) items.push({ image: '/icp.png', url: 'https://beian.miit.gov.cn/#/Integrated/index', label: icp });
    if (guan) items.push({ image: '/gongan.png', url: 'https://beian.mps.gov.cn/#/query/webSearch', label: guan });
    return items;
  }, [settings, loaded]);

  return (
    <footer className="flex w-full flex-col backdrop-blur-sm" id="footer">
      <Separator />
      <div className="mx-auto w-full container! px-6 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <Image src='/logo.svg' width={20} height={20} alt="Logo" />
              <ShimmeringText text={appName} className="text-sm font-black" duration={1.5} repeatDelay={1}
                color="var(--accent)" shimmerColor="var(--accent-foreground)" />
            </div>
            <Separator className="h-4" orientation="vertical" />
            <Status variant="success" className="text-[10px]">
              <StatusIndicator /><StatusLabel>服务状态正常</StatusLabel>
            </Status>
          </div>
          <Description>
            &copy; {dayjs().year()} {" "}
            <a href={copyrightUrl} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
              {copyright}
            </a>
            . All rights reserved.
          </Description>
        </div>
        {icpLinks.length > 0 && (
          <div className="flex flex-col md:flex-row gap-2 items-center text-xs text-muted">
            {icpLinks.map(({ image, url, label }) => (
              <div key={url} className="flex items-center gap-1">
                <Image src={image} alt={label} width={14} height={14} />
                <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">{label}</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </footer>
  )
}
export default Footer;
