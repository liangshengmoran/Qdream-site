/*
 * @Author: QingYun
 * @Date: 2026-02-02 10:19:47
 * @LastEditors: QingYun
 * @LastEditTime: 2026-02-02 11:28:00
 * @Description: 顶部区域
 */
"use client"
import { ArrowDownToLine, ArrowRotateLeft, ArrowUpRightFromSquare, Magnifier, Plus, TrashBin } from '@gravity-ui/icons';
import { Button, Card, ListBox, SearchField, Select, Spinner, toast, useOverlayState } from "@heroui/react";
import { type Table } from '@tanstack/react-table';
import type { SetState } from 'ahooks/es/useSetState';
import { type ChangeEvent, type FC, type KeyboardEvent, useRef, useState } from 'react';

import ColumnsVisibility from '@/components/ColumnsVisibility';
import { CircleCheckFill } from '@gravity-ui/icons';

type HeaderContentProps = {
  table: Table<App.Website>;
  categorysList: App.Category[];
  searchParams: App.WebsiteQueryParams;
  setSearchParams: SetState<App.WebsiteQueryParams>;
  loading: boolean;
  handleSearch: VoidFunction;
  handleReset: VoidFunction;
  saveModalState: ReturnType<typeof useOverlayState>;
  onImportComplete: VoidFunction;
  selectedCount: number;
  onBatchDelete: VoidFunction;
  batchDeleting: boolean;
}

const HeaderContent: FC<HeaderContentProps> = ({
  table,
  categorysList = [],
  searchParams,
  setSearchParams,
  loading = false,
  handleSearch,
  handleReset,
  saveModalState,
  onImportComplete,
  selectedCount,
  onBatchDelete,
  batchDeleting,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/import/bookmarks', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.code === 200) {
        const { createdCategories, createdWebsites, skippedWebsites } = json.data;
        toast.success(`导入完成：${createdCategories} 个分类、${createdWebsites} 个网站${skippedWebsites > 0 ? `，跳过 ${skippedWebsites} 个重复` : ''}`, {
          timeout: 3000,
          indicator: <CircleCheckFill />,
        });
        onImportComplete();
      } else {
        toast.danger(json.msg || '导入失败', { timeout: 3000 });
      }
    } catch {
      toast.danger('导入失败', { timeout: 3000 });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };
  return (
    <Card.Header className="flex justify-between items-start w-full flex-col sm:flex-row sm:items-center gap-2">
      <Card.Title className="flex items-center gap-2 flex-wrap">
        <SearchField
          aria-label='网站名称'
          variant='secondary'
          value={searchParams.name}
          onChange={value => setSearchParams({ name: value })}
          onKeyDown={handleKeyDown}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input className="w-50" placeholder="网站名称" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <Select
          aria-label='所属分类'
          className="w-60"
          placeholder="所属分类"
          variant='secondary'
          value={searchParams.category_id}
          onChange={(id) => setSearchParams({ category_id: id as string })}
        >
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
        <Button isPending={loading} size='sm' onPress={handleSearch}>
          {({ isPending }) => (
            <>
              {isPending ? <Spinner color="current" size='sm' /> : <Magnifier />}
              查询
            </>
          )}
        </Button>
        <Button variant="secondary" size='sm' onPress={handleReset} isDisabled={loading}>
          <ArrowRotateLeft />
          重置
        </Button>
        <Button variant="outline" size='sm' onPress={() => saveModalState.open()}>
          <Plus />
          新增
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".html,.htm"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button variant="outline" size='sm' isPending={importing} onPress={handleImportClick}>
          {({ isPending }) => (
            <>
              {isPending ? <Spinner color="current" size='sm' /> : <ArrowDownToLine />}
              {isPending ? '导入中...' : '导入书签'}
            </>
          )}
        </Button>
        <Button variant="outline" size='sm' onPress={() => window.open('/api/export/bookmarks', '_blank')}>
          <ArrowUpRightFromSquare />导出书签
        </Button>
        {selectedCount > 0 && (
          <Button variant="outline" size='sm' className="text-danger" isPending={batchDeleting} onPress={onBatchDelete}>
            {({ isPending }) => (
              <>
                {isPending ? <Spinner color="current" size='sm' /> : <TrashBin />}
                {isPending ? '删除中...' : `删除选中(${selectedCount})`}
              </>
            )}
          </Button>
        )}
      </Card.Title>
      <ColumnsVisibility table={table} />
    </Card.Header>
  );
}
export default HeaderContent;
