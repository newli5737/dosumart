const cloudinary = require('cloudinary').v2;
const google = require('googlethis');
const fs = require('fs');

cloudinary.config({ 
  cloud_name: 'dn00btmpw', 
  api_key: '819511482585566', 
  api_secret: 'wWMd4AjXJvUPEwCG5_nrFWHD2qc' 
});

const products = {
  miGoi: 'Mì Hảo Hảo tôm chua cay gói',
  gao: 'Gạo thơm Thái ST25 túi 5kg',
  nuocMam: 'Nước mắm Nam Ngư Đệ Nhị',
  tuongOt: 'Tương ớt Chinsu chai thủy tinh',
  hatNem: 'Hạt nêm Knorr thịt thăn',
  dauAn: 'Dầu ăn Simply đậu nành',
  bia: 'Bia 333 Export lon',
  caPhe: 'Cà phê hòa tan G7 3in1',
  nuocKhoang: 'Nước khoáng Lavie chai',
  traXanh: 'Trà xanh Không Độ',
  banh: 'Bánh Chocopie hộp',
  banhQuy: 'Bánh quy Cosy Marie',
  keo: 'Kẹo dừa Bến Tre',
  snack: 'Bim bim Snack khoai tây Oishi',
  botGiat: 'Bột giặt Omo đỏ',
  dauGoi: 'Dầu gội Clear bạc hà',
  kemDanhRang: 'Kem đánh răng PS trà xanh',
  nuocRuaChen: 'Nước rửa chén Sunlight chanh vàng',
  bannerTapHoa: 'tiệm tạp hóa việt nam',
  bannerGiaVi: 'gia vị nhà bếp gia đình',
  bannerDoUong: 'tủ lạnh nước giải khát',
  catThucPham: 'gạo và mì gói',
  catGiaVi: 'nước mắm tương ớt',
  catDoUong: 'bia và nước ngọt',
};

async function uploadImage(name, query) {
  try {
    const images = await google.image(query, { safe: false });
    if (images && images.length > 0) {
      for (const img of images) {
        try {
          console.log(`Uploading ${name} from ${img.url}`);
          const result = await cloudinary.uploader.upload(img.url, { upload_preset: "dosumart" });
          return result.secure_url;
        } catch (uploadErr) {
          console.log(`Failed to upload ${img.url}, trying next...`);
        }
      }
    }
  } catch (error) {
    console.error(`Error for ${name}:`, error.message);
  }
  return null;
}

async function main() {
  const resultObj = {};
  for (const [key, query] of Object.entries(products)) {
    const url = await uploadImage(key, query);
    resultObj[key] = url;
    // sleep to prevent rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log("RESULT JSON:");
  console.log(JSON.stringify(resultObj, null, 2));
  fs.writeFileSync('d:/dosumart/scripts/img_urls.json', JSON.stringify(resultObj, null, 2));
}

main();
