# Chuyển đổi combo MTplus

Dashboard đo lường **MT30** và **CLB 100 tỷ**: tổng quan tháng, bảng đo lường tổng tuần, bảng tick chi tiết, báo cáo TP qua Zalo.

## Cách hoạt động

```
Trình duyệt ──► GitHub Pages (docs/: giao diện, code)
      │
      └──► Google Apps Script web app (apps-script/)  ──►  Google Sheets
             chỉ mtplus.nuycorp@gmail.com mở được          - File Tool quản lý (tick, mục tiêu, ghi chú, báo cáo Zalo)
                                                           - File MT30, file CLB 100 tỷ (dữ liệu các tuần cũ)
```

- `docs/` — giao diện, được GitHub Pages phục vụ: `body.html`, `styles.css`, `app.js` (bộ chạy), `lib.js`, `calcs.js` (cách tính), `draw.js` (vẽ bảng, tick).
- `apps-script/` — mã máy chủ dán vào Google Apps Script: `Code.gs`, `Index.html`.
- Dữ liệu nhập trên web lưu ở 3 tab trong file Tool: `Web - Tick CLB`, `Web - Tick MT30`, `Web - Tổng tuần`.
- Báo cáo Zalo do tác vụ hằng tối của Claude ghi vào tab `Báo cáo Zalo`.

## Sửa giao diện hay cách tính

Sửa file trong `docs/`, đổi số `BAN` trong `docs/app.js` để trình duyệt tải bản mới, rồi commit. GitHub Pages cập nhật sau 1–2 phút.

## Đổi người được tick / nhập

Sửa `NGUOI_DUOC_SUA` trong `apps-script/Code.gs`, dán lại vào Apps Script và triển khai lại (Deploy → Manage deployments → Edit → New version).
