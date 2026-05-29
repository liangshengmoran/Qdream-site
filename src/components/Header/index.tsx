"use client"
import { House } from '@gravity-ui/icons';
import { Button, Tooltip } from '@heroui/react';
import Image from 'next/image';
import Link from "next/link";
import { type FC } from 'react';

import { ShimmeringText } from '@/components/ShimmeringText';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import UserAvatar from '@/components/UserAvatar';
import { GithubIcon } from '@/lib/icons';
import { useSettings } from '@/hooks/use-settings';

const Header: FC = () => {
  const settings = useSettings();
  const appName = settings ? (settings.app_name || process.env.NEXT_PUBLIC_APP_NAME || 'Dream Site') : 'Dream Site';
  const siteLogo = settings?.site_logo || '/logo.svg';
  const githubUrl = settings?.github_url;
  const blogUrl = settings?.blog_url;

  return (
    <header className="sticky top-0 border-b border-default h-15 z-20 backdrop-blur-sm" id="header">
      <div className="flex justify-between items-center container mx-auto h-full px-4">
        <Link href="/">
          <div className="flex gap-2 items-center">
            <Image src={siteLogo} width={36} height={36} alt="Logo" />
            <ShimmeringText
              text={appName}
              className="text-2xl font-black hidden sm:block"
              duration={1.5} repeatDelay={1}
              color="var(--accent)" shimmerColor="var(--accent-foreground)"
            />
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          {githubUrl && (
            <Tooltip delay={0}>
              <Link href={githubUrl} aria-label="GitHub" target="_blank">
                <Button variant="outline" isIconOnly size='sm' className="rounded-full"><GithubIcon /></Button>
              </Link>
              <Tooltip.Content showArrow><Tooltip.Arrow />GitHub</Tooltip.Content>
            </Tooltip>
          )}
          {blogUrl && (
            <Tooltip delay={0}>
              <Link href={blogUrl} aria-label="博客" target="_blank">
                <Button variant="outline" isIconOnly size='sm' className="rounded-full"><House /></Button>
              </Link>
              <Tooltip.Content showArrow><Tooltip.Arrow />博客</Tooltip.Content>
            </Tooltip>
          )}
          <UserAvatar />
        </div>
      </div>
    </header>
  )
}
export default Header;
