"use client"
import { Lock, LockOpen, PencilToSquare, TrashBin } from '@gravity-ui/icons'
import { Button, Chip } from "@heroui/react"
import { createColumnHelper } from "@tanstack/react-table"
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'

const columnHelper = createColumnHelper<App.Category>()

/** 可点击切换的隐私图标（组件自有 state 实现即时切换） */
function PrivateIcon({ cat, onTogglePrivate }: { cat: App.Category; onTogglePrivate: (cat: App.Category, newVal: boolean) => void }) {
  const [optimistic, setOptimistic] = useState<boolean | null>(null)

  // 底层数据变化时重置乐观状态
  useEffect(() => { setOptimistic(null) }, [cat.private])

  const isPrivate = optimistic !== null ? optimistic : cat.private

  return (
    <div className="cursor-pointer hover:opacity-80 flex justify-center" onClick={() => {
      const newVal = !isPrivate
      setOptimistic(newVal)
      onTogglePrivate(cat, newVal)
    }}>
      {isPrivate ? <Lock className="size-4 text-danger" /> : <LockOpen className="size-4 text-success" />}
    </div>
  )
}

type ColumnsProps = {
  handleEdit: (row: App.Category) => void
  handleDel: (row: App.Category) => void
  onTogglePrivate: (row: App.Category, newVal: boolean) => void
  page: number
  pageSize: number
  allCategories: App.Category[]
}

export const getColumns = ({
  handleEdit,
  handleDel,
  onTogglePrivate,
  page = 1,
  pageSize = 10,
  allCategories = [],
}: ColumnsProps) => {
  const getNameById = (id: string | null) => {
    if (!id) return '--'
    return allCategories.find((c) => c.id === id)?.name || '--'
  }

  return [
    columnHelper.display({
      id: "select",
      header: "",
      cell: () => null,
      size: 40,
      enableSorting: false,
    }),

    columnHelper.display({
      id: "index",
      header: "序号",
      cell: ({ row }) => (
        <Chip className="rounded-full">{(page - 1) * pageSize + row.index + 1}</Chip>
      )
    }),

    columnHelper.accessor("name", {
      header: "分类名称",
      cell: ({ getValue }) => (
        <Chip color="accent" variant="primary" className="rounded-full">{getValue()}</Chip>
      )
    }),

    columnHelper.accessor("parent_id", {
      header: "父级分类",
      cell: ({ getValue }) => {
        const parentName = getNameById(getValue() as string | null)
        return <span className="text-xs text-muted">{parentName}</span>
      }
    }),

    columnHelper.display({
      id: "websites",
      header: "站点个数",
      cell: ({ row }) => (
        <Chip color="success" variant="soft" className="rounded-full">
          {row.original.websites?.length || 0}
        </Chip>
      )
    }),

    columnHelper.accessor("private", {
      header: "隐私",
      cell: ({ row }) => (
        <PrivateIcon cat={row.original} onTogglePrivate={onTogglePrivate} />
      )
    }),

    columnHelper.accessor("sort", {
      header: "排序",
      cell: ({ getValue }) => (
        <Chip color="warning" variant="soft" className="rounded-full">{getValue()}</Chip>
      )
    }),

    columnHelper.accessor("created_at", {
      header: "创建时间",
      cell: ({ getValue }) => (
        <span className="text-muted text-xs">{dayjs(getValue()).format("YYYY-MM-DD HH:mm")}</span>
      )
    }),

    columnHelper.accessor("updated_at", {
      header: "更新时间",
      cell: ({ getValue }) => (
        <span className="text-muted text-xs">{dayjs(getValue()).format("YYYY-MM-DD HH:mm")}</span>
      )
    }),

    columnHelper.display({
      id: "actions",
      header: "操作",
      cell: ({ row }) => (
        <div className="flex items-center justify-center min-w-25">
          <Button size="sm" variant="ghost" className="text-xs" onPress={() => handleEdit(row.original)}>
            <PencilToSquare />修改
          </Button>
          <Button size="sm" variant="ghost" className="text-xs text-danger hover:bg-danger-soft" onPress={() => handleDel(row.original)}>
            <TrashBin />删除
          </Button>
        </div>
      )
    })
  ]
}
