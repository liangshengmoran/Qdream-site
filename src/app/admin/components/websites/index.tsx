/*
 * @Author: 白雾茫茫丶<baiwumm.com>
 * @Date: 2026-01-23 15:24:22
 * @LastEditors: QingYun
 * @LastEditTime: 2026-03-11 14:09:27
 * @Description: 网站列表
 */
"use client"
import { CircleCheckFill } from '@gravity-ui/icons';
import { Card, toast, useOverlayState } from "@heroui/react";
import {
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  type RowSelectionState,
  type VisibilityState
} from '@tanstack/react-table';
import { useRequest, useSetState } from 'ahooks';
import { type FC, useCallback, useEffect, useMemo, useState } from 'react';

import { getColumns } from './components/columns'
import DataTable from './components/data-table';
import DeleteDialog from './components/delete-dialog';
import HeaderContent from './components/header-content';
import SaveModal from './components/save-modal';

import DataTablePagination from '@/components/DataTablePagination';
import { RESPONSE } from '@/enums';
import { get } from '@/lib/utils';
import { getCategorysList } from '@/services/categorys';
import { delWebsite, getWebsitesList } from '@/services/websites';

// 初始参数
const InitialParams: App.WebsiteQueryParams = {
  pageIndex: 0,
  pageSize: 10,
  name: '',
  category_id: '',
};

const Websites: FC = () => {
  // 搜索参数
  const [searchParams, setSearchParams] = useSetState<App.WebsiteQueryParams>(InitialParams);
  // 排序
  const [sorting, setSorting] = useState<SortingState>([]);
  // 受控列
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    desc: false,
    logo: false,
    tags: false,
    vpn: false,
    commonlyUsed: false,
    recommend: false,
    updated_at: false
  })
  // 行选择
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // 保存弹窗
  const saveModalState = useOverlayState();
  // 删除弹窗
  const delDialogState = useOverlayState();
  // 编辑数据
  const [editData, setEditData] = useState<App.Website | null>(null);
  // 站点标签
  const [tags, setTags] = useState<string[]>([]);
  // 批量删除
  const [batchDeleting, setBatchDeleting] = useState(false);

  // 请求分类列表
  const { data: categorysList } = useRequest(async (params) => get<App.Category[]>(await getCategorysList(params), 'data.list', []), {
    defaultParams: [{ pageIndex: 0, pageSize: 999 }]
  });

  // 请求网站列表
  const { data, loading, run } = useRequest(async (params) => get(await getWebsitesList(params), 'data', {}), {
    manual: true,
    defaultParams: [searchParams]
  });
  const total = get(data, 'total', 0);

  // 发起请求
  const handleSearch = () => {
    run(searchParams)
    setRowSelection({})
  }

  // 重置
  const handleReset = () => {
    setSearchParams(InitialParams)
    run(InitialParams)
    setRowSelection({})
  }

  // 编辑回调
  const handleEdit = useCallback((row: App.Website) => {
    setEditData(row)
    setTags(row?.tags ?? [])
    saveModalState.open()
  }, [saveModalState])

  // 删除网站
  const { loading: delLoading, run: fetchDelWebsite } = useRequest(delWebsite, {
    manual: true,
    onSuccess: ({ code }) => {
      if (code === RESPONSE.SUCCESS) {
        delDialogState.close();
        toast.success("删除成功", {
          timeout: 2000,
          indicator: <CircleCheckFill />,
        });
        handleSearch();
      }
    },
  });

  // 删除回调
  const handleDel = useCallback((row: App.Website) => {
    setEditData(row)
    delDialogState.open()
  }, [delDialogState])

  // 内联切换 boolean 字段
  const handleToggle = useCallback((_row: App.Website, key: string, value: boolean) => {
    (_row as Record<string, unknown>)[key] = value
    fetch(`/api/websites/${_row.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    }).catch(() => {})
  }, [])

  // 确认删除回调
  const handleDelConfirm = () => {
    if (editData?.id) {
      fetchDelWebsite(editData.id)
    }
  }

  // 批量删除
  const handleBatchDelete = async () => {
    const ids = Object.keys(rowSelection)
    if (ids.length === 0) return

    setBatchDeleting(true)
    try {
      const res = await fetch('/api/websites/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const json = await res.json()
      if (json.code === 200) {
        toast.success(`成功删除 ${json.data.deleted} 个网站`, {
          timeout: 2000,
          indicator: <CircleCheckFill />,
        });
        handleSearch();
      } else {
        toast.danger(json.msg || '批量删除失败', { timeout: 3000 });
      }
    } catch {
      toast.danger('批量删除失败', { timeout: 3000 });
    } finally {
      setBatchDeleting(false)
    }
  }

  const selectedCount = Object.keys(rowSelection).length

  // 列配置项
  const columns = useMemo(
    () => getColumns({ handleEdit, handleDel, onToggle: handleToggle, page: get(data, 'page', 0), pageSize: get(data, 'pageSize', 0) }),
    [handleEdit, handleDel, handleToggle, data]
  )

  // 表格实例
  const table = useReactTable({
    data: get(data, 'list', []),
    columns,
    pageCount: Math.ceil((total || 0) / searchParams.pageSize),
    getRowId: (row: App.Website) => row.id,
    state: {
      pagination: {
        pageIndex: searchParams.pageIndex,
        pageSize: searchParams.pageSize,
      },
      sorting,
      columnVisibility,
      rowSelection,
    },
    onPaginationChange: setSearchParams,
    manualPagination: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
  })

  useEffect(() => {
    run(searchParams)
  }, [run, searchParams.pageIndex, searchParams.pageSize]);

  useEffect(() => {
    if (!saveModalState.isOpen) {
      setEditData(null);
    }
  }, [saveModalState.isOpen]);

  useEffect(() => {
    if (!delDialogState.isOpen) {
      setEditData(null);
    }
  }, [delDialogState.isOpen]);
  return (
    <>
      <Card className="shadow-lg">
        <HeaderContent
          table={table}
          categorysList={categorysList || []}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
          loading={loading}
          handleSearch={handleSearch}
          handleReset={handleReset}
          saveModalState={saveModalState}
          onImportComplete={handleSearch}
          selectedCount={selectedCount}
          onBatchDelete={handleBatchDelete}
          batchDeleting={batchDeleting}
        />
        <Card.Content>
          <DataTable table={table} loading={loading} />
        </Card.Content>
        <Card.Footer>
          <DataTablePagination table={table} total={total || 0} />
        </Card.Footer>
      </Card>
      {/* 保存弹窗 */}
      <SaveModal
        state={saveModalState}
        initialValues={editData}
        handleRefresh={handleSearch}
        tags={tags}
        setTags={setTags}
        categorysList={categorysList || []}
      />
      {/* 删除弹窗 */}
      <DeleteDialog state={delDialogState} loading={delLoading} handleDelConfirm={handleDelConfirm} />
    </>
  )
}
export default Websites;
