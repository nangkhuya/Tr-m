import type { EmotionNode, RoomBackdrop, SeatParticipant, TeaOption, TeaRoom } from '../types/tea';

export const MAX_SEATS_PER_ROOM = 5;

export const TEA_OPTIONS: TeaOption[] = [
  {
    id: 'sen-tay-ho',
    name: 'Trà Sen Tây Hồ',
    mood: 'Thanh thản & Nhẹ nhõm',
    description: 'Sắc vàng nhạt trong trẻo, ướp hương sen Bách Diệp tinh khiết giúp lòng lắng dịu.',
    liquorColor: '#DFC97B',
    liquorHighlight: '#F3E7B3',
    cupRimColor: '#D6CEB8',
    aromaNote: 'Hương cốm non quyện sen sớm',
  },
  {
    id: 'pho-nhi',
    name: 'Phổ Nhĩ Cổ Thụ',
    mood: 'Trầm lắng & Chiêm nghiệm',
    description: 'Sắc đỏ nâu hổ phách ấm sâu, hậu vị dày dặn như ký ức lâu năm được cất giữ.',
    liquorColor: '#8B4226',
    liquorHighlight: '#B86A42',
    cupRimColor: '#C5B6A2',
    aromaNote: 'Gỗ trầm và đất ẩm sau mưa',
  },
  {
    id: 'o-long',
    name: 'Ô Long Núi Cao',
    mood: 'Tỉnh táo & Sáng suốt',
    description: 'Sắc vàng xanh óng ánh, vị thanh ngọt mở rộng tâm trí cho những câu chuyện sáng rõ.',
    liquorColor: '#C7B85B',
    liquorHighlight: '#E6DC92',
    cupRimColor: '#CFD4C5',
    aromaNote: 'Lan rừng và sương sớm vùng cao',
  },
  {
    id: 'bach-tra',
    name: 'Bạch Trà Mẫu Đơn',
    mood: 'Tĩnh tại & Chữa lành',
    description: 'Sắc trắng ngà tinh khiết, vị dịu nhẹ gần như không gợn, vỗ về những mệt nhoài.',
    liquorColor: '#EAE1C7',
    liquorHighlight: '#F8F4E8',
    cupRimColor: '#DDD6C7',
    aromaNote: 'Cỏ mật và nắng mai nhạt',
  },
];

export const EMOTION_WHEEL_NODES: EmotionNode[] = [
  {
    id: 'binh-yen',
    label: 'Bình yên',
    innerState: 'Lòng đang nhẹ nhõm, chỉ muốn giữ trọn nét an tĩnh này.',
    teaId: 'sen-tay-ho',
    recommendationNote:
      'Hương sen Bách Diệp thanh khiết hòa cùng vị cốm non giúp giữ nguyên độ tĩnh và sự thư thái sẵn có.',
  },
  {
    id: 'biet-on',
    label: 'Biết ơn',
    innerState: 'Trân trọng một điều giản dị vừa đi qua trong ngày.',
    teaId: 'sen-tay-ho',
    recommendationNote:
      'Sắc vàng trong trẻo của Trà Sen Tây Hồ nâng niu cảm giác ấm áp và niềm trân quý nhẹ nhàng.',
  },
  {
    id: 'minh-man',
    label: 'Minh mẫn',
    innerState: 'Tâm trí sáng rõ, sẵn sàng đón nhận những góc nhìn mới.',
    teaId: 'o-long',
    recommendationNote:
      'Vị thanh ngọt và hương lan rừng của Ô Long Núi Cao tiếp thêm độ sáng suốt cho cuộc đàm đạo sâu.',
  },
  {
    id: 'tim-huong',
    label: 'Tìm hướng',
    innerState: 'Đang đứng trước một băn khoăn, cần thêm khoảng lặng để nhìn rõ.',
    teaId: 'o-long',
    recommendationNote:
      'Ô Long Núi Cao giúp tâm trí tỉnh táo mà không gắt, mở ra khoảng sáng cho những điều còn bỏ ngỏ.',
  },
  {
    id: 'hoai-niem',
    label: 'Hoài niệm',
    innerState: 'Nhớ về một quãng xưa hoặc điều cần lắng sâu suy ngẫm.',
    teaId: 'pho-nhi',
    recommendationNote:
      'Sắc hổ phách trầm ấm và hậu vị dày dặn của Phổ Nhĩ Cổ Thụ đồng điệu với những tầng ký ức sâu.',
  },
  {
    id: 'tram-tu',
    label: 'Trầm tư',
    innerState: 'Muốn ngồi lại thật lâu để nghe tiếng nói bên trong mình.',
    teaId: 'pho-nhi',
    recommendationNote:
      'Hương gỗ trầm ấm áp của Phổ Nhĩ Cổ Thụ giữ nhịp chậm rãi, làm bạn đồng hành cho sự chiêm nghiệm.',
  },
  {
    id: 'met-nhoai',
    label: 'Mệt nhoài',
    innerState: 'Cần một khoảng thở êm dịu sau nhiều giờ vội vã.',
    teaId: 'bach-tra',
    recommendationNote:
      'Bạch Trà Mẫu Đơn dịu nhẹ gần như không gợn, giúp cơ thể và tâm trí buông lỏng nhẹ nhàng.',
  },
  {
    id: 'chenh-venh',
    label: 'Chênh vênh',
    innerState: 'Lòng có chút xao động, muốn được vỗ về và lắng nghe.',
    teaId: 'bach-tra',
    recommendationNote:
      'Vị cỏ mật thuần khiết của Bạch Trà Mẫu Đơn như một khoảng tựa êm ái để lòng dần bình ổn lại.',
  },
];

export const ROOM_BACKDROPS: RoomBackdrop[] = [
  {
    id: 'veranda-rain',
    label: 'Hiên gỗ nghe mưa',
    subtitle: 'Mái ngói rêu và giọt mưa rơi chậm bên thềm đá',
  },
  {
    id: 'quiet-study',
    label: 'Thư phòng giấy dó',
    subtitle: 'Ánh đèn lụa ấm áp bên giá sách và hương trầm nhẹ',
  },
  {
    id: 'moonlit-bamboo',
    label: 'Đêm trăng rặng trúc',
    subtitle: 'Bóng trúc đung đưa dưới ánh trăng thanh tĩnh mịch',
  },
];

export const DEFAULT_AI_COMPANIONS: Omit<SeatParticipant, 'isUser'>[] = [
  {
    id: 'ai-tue-minh',
    name: 'Thầy Tuệ Minh',
    role: 'Trà Chủ',
    teaId: 'pho-nhi',
    personaNote: 'Điềm tĩnh điều phối, giữ nhịp lắng nghe, gợi mở câu hỏi sâu sắc',
  },
  {
    id: 'ai-giac-khong',
    name: 'Sư Giác Không',
    role: 'Trà Khách',
    teaId: 'bach-tra',
    personaNote: 'Thiền sư hiện đại, nói ngắn gọn, soi chiếu bám chấp và vô thường',
  },
  {
    id: 'ai-lam-an',
    name: 'KTS. Lâm An',
    role: 'Trà Khách',
    teaId: 'o-long',
    personaNote: 'Kiến trúc sư tĩnh lặng, nhạy cảm với khoảng trống, ánh sáng và nhịp điệu',
  },
  {
    id: 'ai-nha-vy',
    name: 'Nhã Vy',
    role: 'Trà Khách',
    teaId: 'sen-tay-ho',
    personaNote: 'Người làm sáng tạo, giàu liên tưởng, chạm vào cảm xúc thật từ chi tiết nhỏ',
  },
];

export const INITIAL_TEA_ROOMS: TeaRoom[] = [
  {
    id: 'hien-tra-chieu',
    name: 'Hiên Trà Chiều',
    subtitle: 'Sống chậm giữa dòng đời vội vã',
    topic: 'Đời sống & Chữa lành',
    backdrop: 'veranda-rain',
    maxSeats: MAX_SEATS_PER_ROOM,
    participantsCount: 4,
    initialPrompt: {
      title: 'Khoảnh khắc ngừng lại',
      question:
        'Trong những ngày gần đây, điều gì giản dị nhất đã khiến bạn bất giác thở chậm lại một nhịp?',
      hint: 'Không cần điều lớn lao, chỉ một khoảnh khắc thật lòng.',
    },
    openingMessage: {
      speakerName: 'Thầy Tuệ Minh',
      role: 'Trà Chủ',
      content:
        'Nước vừa độ sôi chín tới, mời bạn ngồi xuống cho ấm tay. Ngoài hiên chiều nay gió nhẹ, chúng ta không vội đi đâu cả—chỉ xin hỏi bạn, hôm nay lòng mình đang mang theo điều gì?',
    },
  },
  {
    id: 'thu-phong-tinh-lang',
    name: 'Thư Phòng Tĩnh Lặng',
    subtitle: 'Những cuốn sách và bản nhạc làm thay đổi góc nhìn',
    topic: 'Sách & Nghệ thuật',
    backdrop: 'quiet-study',
    maxSeats: MAX_SEATS_PER_ROOM,
    participantsCount: 4,
    initialPrompt: {
      title: 'Trang sách còn âm vang',
      question:
        'Có một câu văn, bài thơ hay giai điệu nào từng ở lại rất lâu trong bạn ngay cả khi bạn đã gấp sách lại?',
      hint: 'Chia sẻ điều chạm vào ký ức hoặc góc nhìn mới của bạn.',
    },
    openingMessage: {
      speakerName: 'Nhã Vy',
      role: 'Trà Khách',
      content:
        'Mùi giấy cũ trong thư phòng chiều nay làm mình nhớ đến một vết ố nước mưa trên trang sách năm xưa. Có những dòng chữ hay nốt nhạc nhỏ xíu thôi, vậy mà đi theo mình qua bao mùa đổi khác.',
    },
  },
  {
    id: 'dem-trang-dam-dao',
    name: 'Đêm Trăng Đàm Đạo',
    subtitle: 'Đối thoại với chính mình qua lăng kính tâm lý học',
    topic: 'Tự vấn & Triết lý',
    backdrop: 'moonlit-bamboo',
    maxSeats: MAX_SEATS_PER_ROOM,
    participantsCount: 4,
    initialPrompt: {
      title: 'Đối diện khoảng lặng',
      question:
        'Khi không còn ai vây quanh và mọi vai diễn thường ngày được cởi bỏ, tiếng nói nào bên trong bạn cất lên rõ nhất?',
      hint: 'Lắng nghe mà không phán xét, như nhìn mặt nước lặng.',
    },
    openingMessage: {
      speakerName: 'Sư Giác Không',
      role: 'Trà Khách',
      content:
        'Chén trà trên bàn nguội dần từng phút, chẳng cần ai nhắc nó cũng đổi thay. Đêm nay ngồi dưới bóng trúc, thử đặt xuống một điều bạn đang nắm quá chặt trong tay xem sao.',
    },
  },
];
