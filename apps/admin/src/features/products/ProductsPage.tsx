import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, Upload, Pencil, Trash2, FileSpreadsheet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { productsApi, categoriesApi, api } from '@dosumart/api';
import { formatCurrency } from '@dosumart/utils';
import { Spinner, EmptyState, Badge } from '@dosumart/ui';
import { PageToolbar, DataTable, TableHead, Th } from '../../components/ui/AdminUI';
import type { Product } from '@dosumart/types';

const emptyForm = {
  name: '',
  categoryId: '',
  brandId: '',
  description: '',
  basePrice: 0,
  salePrice: 0,
  costPrice: 0,
  initialStock: 0,
  lowStockAt: 5,
  isActive: true,
  isFeatured: false,
  images: [] as string[],
};

type ProductForm = typeof emptyForm;

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search],
    queryFn: () => productsApi.adminList({ page: 1, limit: 20, search }),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  });

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: categoriesApi.brands,
  });

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      closeDrawer();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      closeDrawer();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openEdit = (p: Product) => {
    const v = p.variants?.[0];
    setEditingId(p.id);
    setForm({
      name: p.name,
      categoryId: p.category?.id || '',
      brandId: p.brand?.id || '',
      description: p.description || '',
      basePrice: p.basePrice,
      salePrice: v?.price ?? p.basePrice,
      costPrice: v?.costPrice ?? 0,
      initialStock: v?.stock ?? 0,
      lowStockAt: 5,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      images: p.images || [],
    });
    setDrawerOpen(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    try {
      setUploading(true);
      const sigRes = await api.get('/upload/signature');
      const sigData = sigRes.data;
      const uploaded: string[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', sigData.api_key);
        formData.append('timestamp', sigData.timestamp);
        formData.append('signature', sigData.signature);
        formData.append('upload_preset', sigData.upload_preset);
        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloud_name}/image/upload`, {
          method: 'POST',
          body: formData,
        });
        const cloudData = await cloudRes.json();
        if (cloudData.secure_url) uploaded.push(cloudData.secure_url);
      }

      if (uploaded.length) {
        setForm((f) => ({ ...f, images: [...f.images, ...uploaded] }));
      }
    } catch {
      alert('Tải ảnh thất bại, vui lòng thử lại.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const set = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = () => {
    if (!form.name.trim() || !form.categoryId) {
      alert('Vui lòng nhập tên sản phẩm và chọn danh mục.');
      return;
    }
    if (!form.salePrice || form.salePrice <= 0) {
      alert('Vui lòng nhập giá bán hợp lệ.');
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: {
          name: form.name.trim(),
          description: form.description,
          categoryId: form.categoryId,
          brandId: form.brandId || undefined,
          images: form.images,
          basePrice: form.basePrice || form.salePrice,
          isActive: form.isActive,
          isFeatured: form.isFeatured,
          salePrice: form.salePrice,
          costPrice: form.costPrice || undefined,
        },
      });
      return;
    }

    const ts = Date.now();
    const sku = `DSM-${ts}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const barcode = `893${String(ts).slice(-10)}`;
    createMutation.mutate({
      name: form.name.trim(),
      description: form.description,
      categoryId: form.categoryId,
      brandId: form.brandId || undefined,
      images: form.images,
      basePrice: form.basePrice || form.salePrice,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      variants: [{
        sku,
        barcode,
        attributes: {},
        price: form.salePrice,
        costPrice: form.costPrice || undefined,
        initialStock: form.initialStock,
      }],
    });
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      const cats = categories?.data || [];
      let ok = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (i === 0 && line.toLowerCase().includes('tên')) continue;
        const [name, catName, priceStr, stockStr] = line.split(',').map((s) => s.trim());
        if (!name || !catName) continue;
        const cat = cats.find((c: { name: string }) => c.name.toLowerCase() === catName.toLowerCase());
        if (!cat) continue;
        const price = Number(priceStr) || 0;
        const stock = Number(stockStr) || 0;
        const ts = Date.now() + i;
        await productsApi.create({
          name,
          categoryId: cat.id,
          basePrice: price,
          isActive: true,
          variants: [{
            sku: `DSM-${ts}`,
            barcode: `893${String(ts).slice(-10)}`,
            attributes: {},
            price,
            initialStock: stock,
          }],
        });
        ok++;
      }
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      alert(`Đã import ${ok} sản phẩm.`);
    } catch {
      alert('Import thất bại. Dùng CSV: tên,danh mục,giá,tồn');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const inputCls = 'h-11 w-full rounded-[10px] border border-gray-200 px-3 text-sm focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-100';
  const labelCls = 'mb-1.5 block text-sm font-medium text-[#374151]';

  return (
    <div>
      <PageToolbar
        title="Quản lý sản phẩm"
        description={`${data?.meta?.total ?? 0} sản phẩm trong hệ thống`}
        action={
          <div className="flex gap-2">
            <Link to="/danh-muc" className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-gray-200 px-4 text-sm font-medium hover:bg-gray-50">
              Danh mục
            </Link>
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[10px] border border-gray-200 px-4 text-sm font-medium hover:bg-gray-50">
              <FileSpreadsheet className="h-4 w-4" />
              {importing ? 'Đang import...' : 'Import CSV'}
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvImport} disabled={importing} />
            </label>
            <button
              type="button"
              onClick={() => { setEditingId(null); setForm(emptyForm); setDrawerOpen(true); }}
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#f97316] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#ea580c]"
            >
              <Plus className="h-4 w-4" />
              Tạo sản phẩm
            </button>
          </div>
        }
      />

      <div className="mb-4 flex gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Tìm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-[10px] border border-gray-200 bg-white pl-9 pr-4 text-sm focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-100"
          />
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : data?.data?.length === 0 ? (
        <EmptyState
          title="Chưa có sản phẩm nào"
          description="Nếu đây là lần đầu sử dụng, hãy tạo sản phẩm đầu tiên."
          action={
            <button type="button" onClick={() => setDrawerOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#f97316] px-4 text-sm font-semibold text-white">
              <Plus className="h-4 w-4" /> Tạo sản phẩm
            </button>
          }
        />
      ) : (
        <DataTable>
          <table className="w-full text-[13px]">
            <TableHead>
              <Th>Sản phẩm</Th>
              <Th>SKU</Th>
              <Th>Danh mục</Th>
              <Th align="right">Giá gốc</Th>
              <Th align="right">Giá bán</Th>
              <Th align="right">Giá nhập</Th>
              <Th align="right">Tồn kho</Th>
              <Th>Trạng thái</Th>
              <Th>Thao tác</Th>
            </TableHead>
            <tbody>
              {(data?.data || []).map((p: Product) => {
                const v = p.variants?.[0];
                return (
                  <tr key={p.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-orange-50/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {p.images[0] && (
                          <img src={p.images[0]} alt="" className="h-10 w-10 rounded-xl object-cover border border-gray-100 shadow-sm" />
                        )}
                        <span className="font-medium text-[#111827]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-[#9ca3af]">{v?.sku ?? '—'}</td>
                    <td className="px-5 py-4 text-[#6b7280]">{p.category?.name}</td>
                    <td className="px-5 py-4 text-right text-[#9ca3af] line-through">{formatCurrency(p.basePrice)}</td>
                    <td className="px-5 py-4 text-right font-semibold text-[#f97316]">{formatCurrency(v?.price ?? p.basePrice)}</td>
                    <td className="px-5 py-4 text-right text-[#6b7280]">{v?.costPrice ? formatCurrency(v.costPrice) : '—'}</td>
                    <td className="px-5 py-4 text-right">{v?.stock ?? 0}</td>
                    <td className="px-5 py-4">
                      <Badge variant={p.isActive ? 'success' : 'default'}>
                        {p.isActive ? 'Đang bán' : 'Ngừng bán'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button type="button" className="text-[#f97316] hover:text-[#ea580c]" onClick={() => openEdit(p)} title="Sửa">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => { if (confirm(`Xóa "${p.name}"?`)) deleteMutation.mutate(p.id); }}
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </DataTable>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="animate-slide-in-right h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold">{editingId ? 'Sửa sản phẩm' : 'Tạo sản phẩm'}</h2>
                <p className="text-xs text-[#9ca3af]">{editingId ? 'Cập nhật thông tin sản phẩm' : 'Điền đầy đủ thông tin giá và tồn kho'}</p>
              </div>
              <button type="button" onClick={closeDrawer} className="rounded-[10px] p-2 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <section className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Thông tin cơ bản</h3>
                <div>
                  <label className={labelCls}>Tên sản phẩm <span className="text-red-500">*</span></label>
                  <input className={inputCls} placeholder="VD: Nước rửa chén Sunlight 750ml" value={form.name} onChange={(e) => set('name', e.target.value)} />
                  <p className="mt-1 text-[10px] text-[#9ca3af]">Mã SKU và mã vạch sẽ tự sinh khi lưu</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Danh mục <span className="text-red-500">*</span></label>
                    <select className={inputCls} value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                      <option value="">Chọn danh mục</option>
                      {(categories?.data || []).map((c: { id: string; name: string }) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Thương hiệu</label>
                    <select className={inputCls} value={form.brandId} onChange={(e) => set('brandId', e.target.value)}>
                      <option value="">Chọn thương hiệu</option>
                      {(brands?.data || []).map((b: { id: string; name: string }) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Mô tả</label>
                  <textarea className="w-full rounded-[10px] border border-gray-200 p-3 text-sm focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-100" placeholder="Mô tả chi tiết sản phẩm..." rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-orange-100 bg-orange-50/40 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#f97316]">Giá & Tồn kho</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Giá gốc (niêm yết)</label>
                    <input type="number" min={0} className={inputCls} placeholder="0" value={form.basePrice || ''} onChange={(e) => set('basePrice', Number(e.target.value))} />
                    <p className="mt-1 text-[10px] text-[#9ca3af]">Hiển thị gạch ngang nếu cao hơn giá bán</p>
                  </div>
                  <div>
                    <label className={labelCls}>Giá bán <span className="text-red-500">*</span></label>
                    <input type="number" min={0} className={inputCls} placeholder="0" value={form.salePrice || ''} onChange={(e) => set('salePrice', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className={labelCls}>Giá nhập (vốn)</label>
                    <input type="number" min={0} className={inputCls} placeholder="0" value={form.costPrice || ''} onChange={(e) => set('costPrice', Number(e.target.value))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Số lượng tồn kho</label>
                    <input type="number" min={0} className={inputCls} placeholder="0" value={form.initialStock || ''} onChange={(e) => set('initialStock', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className={labelCls}>Cảnh báo khi còn</label>
                    <input type="number" min={0} className={inputCls} placeholder="5" value={form.lowStockAt} onChange={(e) => set('lowStockAt', Number(e.target.value))} />
                  </div>
                </div>
                {form.salePrice > 0 && form.costPrice > 0 && (
                  <p className="text-xs text-[#16a34a]">
                    Lãi gộp: {formatCurrency(form.salePrice - form.costPrice)} ({Math.round(((form.salePrice - form.costPrice) / form.salePrice) * 100)}%)
                  </p>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Hình ảnh</h3>
                <div className="flex flex-wrap gap-2">
                  {form.images.map((img, i) => (
                    <div key={i} className="group relative">
                      <img src={img} alt="" className="h-20 w-20 rounded-[8px] border border-gray-200 object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-dashed border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100">
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Đang tải lên...' : 'Tải ảnh (có thể chọn nhiều)'}
                  <input type="file" className="hidden" accept="image/*" multiple onChange={handleUpload} disabled={uploading} />
                </label>
              </section>

              <section className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="rounded border-gray-300 text-[#f97316] focus:ring-orange-200" />
                  Đang bán
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="rounded border-gray-300 text-[#f97316] focus:ring-orange-200" />
                  Sản phẩm nổi bật
                </label>
              </section>

              <div className="sticky bottom-0 flex gap-2 border-t border-gray-100 bg-white pt-4">
                <button type="button" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 h-11 rounded-[10px] bg-[#f97316] text-sm font-semibold text-white hover:bg-[#ea580c] disabled:opacity-60">
                  {(createMutation.isPending || updateMutation.isPending) ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Lưu sản phẩm'}
                </button>
                <button type="button" onClick={closeDrawer} className="h-11 rounded-[10px] border border-gray-200 px-4 text-sm hover:bg-gray-50">
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
