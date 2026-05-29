"use client"
import { ArrowRotateLeft, FolderTree, Magnifier, Plus, TrashBin } from '@gravity-ui/icons';
import { Button, Card, ListBox, SearchField, Select, Spinner, useOverlayState } from "@heroui/react";
import { type Table } from '@tanstack/react-table';
import type { SetState } from 'ahooks/es/useSetState';
import { type FC, type KeyboardEvent, useState } from 'react';

import ColumnsVisibility from '@/components/ColumnsVisibility';

type HeaderContentProps = {
  table: Table<App.Category>;
  searchParams: App.CategoryQueryParams;
  setSearchParams: SetState<App.CategoryQueryParams>;
  loading: boolean;
  handleSearch: VoidFunction;
  handleReset: VoidFunction;
  saveModalState: ReturnType<typeof useOverlayState>;
  selectedCount: number;
  onBatchDelete: VoidFunction;
  batchDeleting: boolean;
  allCategories: App.Category[];
  onBatchParentUpdate: (parentId: string) => void;
  batchParentUpdating: boolean;
}

const HeaderContent: FC<HeaderContentProps> = ({
  table,
  searchParams,
  setSearchParams,
  loading = false,
  handleSearch,
  handleReset,
  saveModalState,
  selectedCount,
  onBatchDelete,
  batchDeleting,
  allCategories = [],
  onBatchParentUpdate,
  batchParentUpdating,
}) => {
  const [parentSelectKey, setParentSelectKey] = useState<string>('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); handleSearch(); }
  };
  return (
    <Card.Header className="flex justify-between items-start w-full flex-col sm:flex-row sm:items-center gap-2">
      <Card.Title className="flex items-center gap-2 flex-wrap">
        <SearchField aria-label='分类名称' variant='secondary' value={searchParams.name} onChange={value => setSearchParams({ name: value })} onKeyDown={handleKeyDown}>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input className="w-50" placeholder="分类名称" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <Button isPending={loading} size='sm' onPress={handleSearch}>
          {({ isPending }) => (<>{isPending ? <Spinner color="current" size='sm' /> : <Magnifier />}查询</>)}
        </Button>
        <Button variant="secondary" size='sm' onPress={handleReset} isDisabled={loading}><ArrowRotateLeft />重置</Button>
        <Button variant="outline" size='sm' onPress={() => saveModalState.open()}><Plus />新增</Button>
        {selectedCount > 0 && (
          <>
            <Button variant="outline" size='sm' className="text-danger" isPending={batchDeleting} onPress={onBatchDelete}>
              {({ isPending }) => (<>{isPending ? <Spinner color="current" size='sm' /> : <TrashBin />}{isPending ? '删除中...' : `删除选中(${selectedCount})`}</>)}
            </Button>
            <Select
              aria-label="设置父级"
              placeholder="设置父级"
              className="w-40"
              variant="secondary"
              size="sm"
              isDisabled={batchParentUpdating}
              selectedKeys={parentSelectKey ? [parentSelectKey] : []}
              onSelectionChange={(keys) => {
                const arr = Array.from(keys as Set<string>)
                const val = arr[0] || ''
                setParentSelectKey(val)
                onBatchParentUpdate(val)
              }}
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item key="" id="" textValue="无（顶级分类）">无（顶级分类）<ListBox.ItemIndicator /></ListBox.Item>
                  {allCategories.map((c) => (
                    <ListBox.Item key={c.id} id={c.id} textValue={c.name}>{c.name}<ListBox.ItemIndicator /></ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </>
        )}
      </Card.Title>
      <ColumnsVisibility table={table} />
    </Card.Header>
  );
}
export default HeaderContent;
