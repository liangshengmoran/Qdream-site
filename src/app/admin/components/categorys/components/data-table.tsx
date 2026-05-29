import { ChevronUp } from '@gravity-ui/icons';
import { cn, Table } from "@heroui/react";
import { flexRender, type Row, type Table as TableInstance } from '@tanstack/react-table';
import { type FC } from 'react';

import EmptyContent from '@/components/EmptyContent';
import TableLoading from '@/components/TableLoading';
import { ADMIN_TABS } from '@/enums';

type DataTableProps = {
  table: TableInstance<App.Category>;
  loading: boolean;
}

const RowCheckbox = ({ row }: { row: Row<App.Category> }) => (
  <Table.Cell className="text-center">
    <div
      className="size-4 rounded border-2 border-muted-foreground/30 flex items-center justify-center cursor-pointer select-none"
      style={{
        backgroundColor: row.getIsSelected() ? 'var(--accent)' : 'transparent',
        borderColor: row.getIsSelected() ? 'var(--accent)' : undefined,
      }}
      onClick={() => row.toggleSelected(!row.getIsSelected())}
    >
      {row.getIsSelected() && <span className="text-white text-[10px] leading-none">✓</span>}
    </div>
  </Table.Cell>
)

const DataTable: FC<DataTableProps> = ({ table, loading = false }) => {
  const allSelected = table.getIsAllRowsSelected()
  const someSelected = table.getIsSomeRowsSelected()

  return (
    <div className="relative">
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label={ADMIN_TABS.label(ADMIN_TABS.CATEGOTYS)}>
            <Table.Header>
              {table.getHeaderGroups()[0]!.headers.map((header) => {
                const sortDirection = header.column.getIsSorted()
                if (header.id === 'select') {
                  return (
                    <Table.Column key={header.id} id={header.id} className="w-10">
                      <div
                        className="size-4 rounded border-2 border-muted-foreground/30 flex items-center justify-center cursor-pointer select-none"
                        style={{
                          backgroundColor: allSelected ? 'var(--accent)' : 'transparent',
                          borderColor: (someSelected && !allSelected) || allSelected ? 'var(--accent)' : undefined,
                        }}
                        onClick={(e) => { e.stopPropagation(); table.toggleAllRowsSelected(!allSelected) }}
                      >
                        {allSelected && <span className="text-white text-[10px] leading-none">✓</span>}
                        {someSelected && !allSelected && <span className="w-2 h-0.5 bg-[var(--accent)]" />}
                      </div>
                    </Table.Column>
                  )
                }
                return (
                  <Table.Column key={header.id} allowsSorting={header.column.getCanSort()} id={header.id} isRowHeader onClick={header.column.getToggleSortingHandler()}>
                    <div className="flex items-center justify-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sortDirection && <ChevronUp className={cn("size-3 transform transition-transform duration-100 ease-out", sortDirection === "desc" ? "rotate-180" : "")} />}
                    </div>
                  </Table.Column>
                )
              })}
            </Table.Header>
            <Table.Body renderEmptyState={() => <EmptyContent />}>
              {table.getRowModel().rows.map((row) => (
                <Table.Row key={row.id} id={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    if (cell.column.id === 'select') return <RowCheckbox key={cell.id} row={row} />
                    return (
                      <Table.Cell key={cell.id} className="text-center">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Table.Cell>
                    )
                  })}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
      <TableLoading loading={loading} />
    </div>
  )
}
export default DataTable;
