
const BASE=[
"xin chào|chao|hello|hi|alo|hey|good morning|good evening|good afternoon|yo|hii",
"sản phẩm|san pham|product|shop|catalog|danh mục|danh muc|hàng|hang|mặt hàng|mat hang|tool|file|dịch vụ|dich vu|tài nguyên|tai nguyen",
"giá|gia|bao nhiêu|bao nhieu|price|cost|rẻ|re|đắt|dat|khuyến mãi|khuyen mai|sale|deal|ưu đãi|uu dai",
"nạp tiền|nap tien|nạp|nap|chuyển khoản|chuyen khoan|qr|bank|ngân hàng|ngan hang|deposit|thanh toán|thanh toan|thẻ cào|the cao|card|seri|mã thẻ|ma the",
"số dư|so du|balance|ví|vi|wallet|tiền|tien|còn bao nhiêu|con bao nhieu|lịch sử ví|lich su vi",
"đơn hàng|don hang|order|đã mua|da mua|lịch sử mua|lich su mua|trạng thái đơn|trang thai don|hủy đơn|huy don|mã đơn|ma don",
"tải xuống|tai xuong|download|link tải|link tai|file đã mua|file da mua|license|key|mã kích hoạt|ma kich hoat|tệp|tep",
"vip|thành viên|thanh vien|membership|silver|gold|diamond|kim cương|kim cuong|hạng|hang|nâng hạng|nang hang|quyền lợi|quyen loi",
"mã giảm giá|ma giam gia|coupon|voucher|khuyến mãi|khuyen mai|discount|promo|code|mã ưu đãi|ma uu dai",
"tài khoản|tai khoan|đăng nhập|dang nhap|đăng ký|dang ky|mật khẩu|mat khau|quên mật khẩu|quen mat khau|email|avatar|hồ sơ|ho so|đổi mật khẩu|doi mat khau",
"admin|nhân viên|nhan vien|hỗ trợ|ho tro|support|liên hệ|lien he|người thật|nguoi that|zalo|chat admin|gặp admin",
"hoàn tiền|hoan tien|refund|trả tiền|tra tien|khiếu nại|khieu nai|bảo hành|bao hanh|đổi trả|doi tra",
"bảo mật|bao mat|an toàn|an toan|security|đăng xuất|dang xuat|phiên|phien|xác thực|xac thuc|otp",
"nhạc|nhac|music|bài hát|bai hat|playlist|âm thanh|am thanh|volume|âm lượng|am luong",
"giao diện|giao dien|dark|light|sáng|sang|tối|toi|english|tiếng anh|tieng anh|tiếng việt|tieng viet|ngôn ngữ|ngon ngu",
"đánh giá|danh gia|review|sao|stars|nhận xét|nhan xet|mua bao nhiêu|luot mua|lượt mua",
"vault|kho sản phẩm|kho san pham|trưng bày|trung bay|showcase|marketplace|cửa hàng|cua hang"
];
const PREFIXES=["cho tôi","cho toi","tôi muốn","toi muon","mình cần","minh can","bạn có","ban co","có thể","co the","làm sao","lam sao","hướng dẫn","huong dan","giúp","giup","vui lòng","vui long","xin hỏi","xin hoi","mình hỏi","minh hoi","tư vấn","tu van","how to","can i","i need","i want","where is","help me","please","check","kiểm tra","kiem tra","cho biết","cho biet","tôi đang cần","toi dang can","mình đang tìm","minh dang tim","mình muốn biết","minh muon biet","tôi có thể","toi co the","bạn hướng dẫn","ban huong dan","bạn giải thích","ban giai thich","có cách nào","co cach nao","xin tư vấn","xin tu van","cho hỏi","cho hoi","mình cần biết","minh can biet"];
const SUFFIXES=["không","khong","được không","duoc khong","thế nào","the nao","ở đâu","o dau","bao nhiêu","bao nhieu","giúp mình","giup minh","nhé","nhe","ạ","a","please","now","hôm nay","hom nay","ngay bây giờ","ngay bay gio","với","voi","cho mình","cho minh","được chứ","duoc chu","cụ thể","cu the","nhanh","ngay","ạ bạn","a ban"];
const CONTEXTS=["trên web","tren web","trong shop","trong vault","trong tài khoản","trong tai khoan","sau khi mua","trước khi mua","khi thanh toán","khi nap tien","khi đăng nhập","khi dang nhap","trên điện thoại","tren dien thoai","trên máy tính","tren may tinh","về sản phẩm","ve san pham","về đơn hàng","ve don hang","về ví","ve vi","về hỗ trợ","ve ho tro","về tài khoản","ve tai khoan"];
export const KEYWORD_GROUPS=BASE.flatMap(x=>x.split("|").map(s=>s.trim()));
export const EXPANDED_KEYWORDS=(()=>{const out=new Set<string>(KEYWORD_GROUPS);for(const base of KEYWORD_GROUPS){for(const prefix of PREFIXES.slice(0,12))out.add(`${prefix} ${base}`);for(const suffix of SUFFIXES.slice(0,8))out.add(`${base} ${suffix}`);for(const prefix of PREFIXES.slice(0,12)){for(const suffix of SUFFIXES.slice(0,8))out.add(`${prefix} ${base} ${suffix}`);for(const context of CONTEXTS.slice(0,5))out.add(`${prefix} ${base} ${context}`);}for(const context of CONTEXTS.slice(0,5)){out.add(`${base} ${context}`);for(const suffix of SUFFIXES.slice(0,8))out.add(`${base} ${context} ${suffix}`);}}for(const base of KEYWORD_GROUPS.slice(0,90))for(const context of CONTEXTS.slice(0,5))for(const suffix of SUFFIXES.slice(0,8))out.add(`${base} ${context} ${suffix}`);return [...out]})();
export const KEYWORD_INDEX_SIZE=EXPANDED_KEYWORDS.length;
export const CORE_KEYWORD_TOKENS=new Set(KEYWORD_GROUPS.flatMap(k=>k.split(/\s+/)));
