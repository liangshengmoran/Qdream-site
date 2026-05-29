/*
 * @Author: 白雾茫茫丶<baiwumm.com>
 * @Date: 2026-01-23 15:24:22
 * @LastEditors: QingYun
 * @LastEditTime: 2026-03-11 14:01:08
 * @Description: 网站分类
 */
"use client"
import { CircleCheckFill, CircleXmarkFill } from '@gravity-ui/icons';
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
import { delCategory, getCategorysList } from '@/services/categorys';

// 初始参数
const InitialParams: App.WebsiteQueryParams = {
  pageIndex: 0,
  pageSize: 10,
  name: '',
};

const Categorys: FC = () => {
  // 搜索参数
  const [searchParams, setSearchParams] = useSetState<App.CategoryQueryParams>(InitialParams);
  // 排序
  const [sorting, setSorting] = useState<SortingState>([]);
  // 受控列
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    updated_at: false
  })
  // 行选择
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  // 保存弹窗
  const saveModalState = useOverlayState();
  // 删除弹窗
  const delDialogState = useOverlayState();
  // 编辑数据
  const [editData, setEditData] = useState<App.Category | null>(null);
  // 批量删除
  const [batchDeleting, setBatchDeleting] = useState(false);
  // 批量设置父级
  const [batchParentUpdating, setBatchParentUpdating] = useState(false);

  // 请求分类列表
  const { data, loading, run } = useRequest(async (params) => get(await getCategorysList(params), 'data', {}), {
    manual: true,
    defaultParams: [searchParams]
  });
  const total = get(data, 'total', 0);
  const categorysList = get(data, 'list', []);

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
  const handleEdit = useCallback((row: App.Category) => {
    setEditData(row)
    saveModalState.open()
  }, [saveModalState])

  // 删除分类
  const { loading: delLoading, run: fetchDelCategory } = useRequest(delCategory, {
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
  const handleDel = useCallback((row: App.Category) => {
    if (row?.websites?.length) {
      toast.danger('该分类下存在关联网站，无法直接删除.', {
        indicator: <CircleXmarkFill />,
        timeout: 3000
      })
      return
    }
    setEditData(row)
    delDialogState.open()
  }, [delDialogState])

  // 确认删除回调
  const handleDelConfirm = () => {
    if (editData?.id) {
      fetchDelCategory(editData.id)
    }
  }

  // 内联切换隐私状态
  const handleTogglePrivate = useCallback((_row: App.Category, newVal: boolean) => {
    (_row as Record<string, unknown>).private = newVal
    fetch(`/api/categorys/${_row.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ private: newVal }),
    }).catch(() => {})
  }, [])

  // 批量删除
  const handleBatchDelete = async () => {
    const ids = Object.keys(rowSelection)
    if (ids.length === 0) return

    setBatchDeleting(true)
    try {
      const res = await fetch('/api/categorys/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const json = await res.json()
      if (json.code === 200) {
        toast.success(`成功删除 ${json.data.deleted} 个分类`, {
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

  // 批量设置父级
  const handleBatchParentUpdate = async (parentId: string) => {
    const ids = Object.keys(rowSelection)
    if (ids.length === 0) return
    setBatchParentUpdating(true)
    try {
      const res = await fetch('/api/categorys/batch-update-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, parent_id: parentId }),
      })
      const json = await res.json()
      if (json.code === 200) {
        toast.success(`已更新 ${json.data.updated} 个分类`, { timeout: 2000, indicator: <CircleCheckFill /> });
        handleSearch();
      } else {
        toast.danger(json.msg || '更新失败', { timeout: 3000 });
      }
    } catch { toast.danger('更新失败', { timeout: 3000 }); }
    finally { setBatchParentUpdating(false) }
  }

  const selectedCount = Object.keys(rowSelection).length

  // 列配置项
  const columns = useMemo(
    () => getColumns({ handleEdit, handleDel, onTogglePrivate: handleTogglePrivate, page: get(data, 'page', 0), pageSize: get(data, 'pageSize', 0), allCategories: categorysList }),
    [handleEdit, handleDel, data, categorysList]
  );

  // 表格实例
  const table = useReactTable({
    data: categorysList,
    columns,
    pageCount: Math.ceil((total || 0) / searchParams.pageSize),
    getRowId: (row: App.Category) => row.id,
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
          searchParams={searchParams}
          setSearchParams={setSearchParams}
          loading={loading}
          handleSearch={handleSearch}
          handleReset={handleReset}
          saveModalState={saveModalState}
          selectedCount={selectedCount}
          onBatchDelete={handleBatchDelete}
          batchDeleting={batchDeleting}
          allCategories={categorysList}
          onBatchParentUpdate={handleBatchParentUpdate}
          batchParentUpdating={batchParentUpdating}
        />
        <Card.Content>
          <DataTable table={table} loading={loading} />
        </Card.Content>
        <Card.Footer>
          <DataTablePagination table={table} total={total || 0} />
        </Card.Footer>
      </Card>
      {/* 保存弹窗 */}
      <SaveModal state={saveModalState} initialValues={editData} handleRefresh={handleSearch} allCategories={categorysList} />
      {/* 删除弹窗 */}
      <DeleteDialog state={delDialogState} loading={delLoading} handleDelConfirm={handleDelConfirm} />
    </>
  )
}
export default Categorys;
