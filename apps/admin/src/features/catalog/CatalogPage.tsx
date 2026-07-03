import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { categoriesApi } from '@dosumart/api';
import { Spinner } from '@dosumart/ui';
import { PageToolbar, DataTable, TableHead, Th } from '../../components/ui/AdminUI';

type Tab = 'categories' | 'brands';

export default function CatalogPage() {
  const [tab, setTab] = useState<Tab>('categories');
  const [name, setName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  });

  const { data: brands, isLoading: brandLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: categoriesApi.brands,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('empty');
      if (tab === 'categories') {
        if (editId) return categoriesApi.updateCategory(editId, { name: name.trim() });
        return categoriesApi.createCategory({ name: name.trim() });
      }
      if (editId) return categoriesApi.updateBrand(editId, { name: name.trim() });
      return categoriesApi.createBrand({ name: name.trim() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tab === 'categories' ? 'categories' : 'brands'] });
      setName('');
      setEditId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      tab === 'categories' ? categoriesApi.deleteCategory(id) : categoriesApi.deleteBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tab === 'categories' ? 'categories' : 'brands'] });
    },
  });

  const items = tab === 'categories' ? categories?.data || [] : brands?.data || [];
  const loading = tab === 'categories' ? catLoading : brandLoading;

  return (
    <div>
      <PageToolbar
        title="Danh mục & Thương hiệu"
        description="Quản lý phân loại sản phẩm"
      />

      <div className="mb-6 flex gap-2">
        {(['categories', 'brands'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setEditId(null); setName(''); }}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium ${
              tab === t ? 'bg-[#f97316] text-white' : 'border border-gray-200 bg-white hover:border-orange-200'
            }`}
          >
            {t === 'categories' ? 'Danh mục' : 'Thương hiệu'}
          </button>
        ))}
      </div>

      <div className="mb-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={tab === 'categories' ? 'Tên danh mục mới...' : 'Tên thương hiệu mới...'}
          className="h-10 flex-1 max-w-sm rounded-xl border border-gray-200 px-4 text-sm focus:border-[#f97316] focus:outline-none"
        />
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#f97316] px-4 text-sm font-semibold text-white hover:bg-[#ea580c]"
        >
          <Plus className="h-4 w-4" />
          {editId ? 'Cập nhật' : 'Thêm'}
        </button>
        {editId && (
          <button type="button" onClick={() => { setEditId(null); setName(''); }} className="h-10 rounded-xl border px-4 text-sm hover:bg-gray-50">
            Hủy
          </button>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <DataTable>
          <table className="w-full text-[13px]">
            <TableHead>
              <Th>Tên</Th>
              <Th>Slug</Th>
              <Th>Thao tác</Th>
            </TableHead>
            <tbody>
              {items.map((item: { id: string; name: string; slug: string }) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-orange-50/40">
                  <td className="px-5 py-4 font-medium">{item.name}</td>
                  <td className="px-5 py-4 text-gray-400">{item.slug}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-[#f97316] hover:underline"
                        onClick={() => { setEditId(item.id); setName(item.name); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="text-red-500 hover:underline"
                        onClick={() => {
                          if (confirm(`Xóa "${item.name}"?`)) deleteMutation.mutate(item.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      )}
    </div>
  );
}
