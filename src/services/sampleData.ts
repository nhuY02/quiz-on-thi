import { SavedQuizBank } from '../types/quiz';

export const SAMPLE_QUIZ_BANK: SavedQuizBank = {
  id: 'sample_distributed_systems_2026',
  title: 'Kiến trúc Hệ thống Phân tán & Microservices',
  createdAt: new Date().toISOString(),
  fileName: 'Tai_Lieu_On_Thi_Distributed_Systems.pdf',
  fileSize: 1024 * 342, // ~342 KB
  sections: [
    {
      id: 'sec_1',
      index: 1,
      title: 'Chương 1: Nguyên lý cơ bản và Định lý CAP',
      content: 'Hệ thống phân tán (Distributed System) là tập hợp các máy tính độc lập xuất hiện trước người dùng như một hệ thống đơn lẻ thống nhất. Định lý CAP chỉ ra rằng một hệ thống phân tán chỉ có thể đồng thời thỏa mãn tối đa 2 trong 3 yếu tố: Consistency (Tính nhất quán), Availability (Tính sẵn sàng), và Partition Tolerance (Khả năng chịu phân mảnh mạng). Vì lỗi mạng trong thực tế là không thể tránh khỏi (Network Partitioning luôn xảy ra), các kiến trúc thực tế thường phải lựa chọn đánh đổi giữa CP hoặc AP. BASE (Basically Available, Soft state, Eventual consistency) là mô hình nới lỏng tính nhất quán của ACID để ưu tiên High Availability.',
      wordCount: 145,
      pageRange: 'Trang 1 - 3',
      keyConcepts: ['Distributed System', 'CAP Theorem', 'Consistency', 'Availability', 'Partition Tolerance', 'Eventual Consistency'],
      coveredConcepts: ['Distributed System', 'CAP Theorem', 'Consistency', 'Availability', 'Partition Tolerance', 'Eventual Consistency'],
      status: 'completed',
      questions: [
        {
          id: 'q_s1_1',
          section: 'Chương 1: Nguyên lý cơ bản và Định lý CAP',
          topic: 'Định lý CAP',
          question: 'Theo Định lý CAP (CAP Theorem), khi xảy ra hiện tượng phân mảnh mạng (Network Partition), hệ thống bắt buộc phải đánh đổi giữa hai yếu tố nào?',
          options: [
            'Consistency (Tính nhất quán) và Availability (Tính sẵn sàng)',
            'Throughput (Băng thông) và Latency (Độ trễ)',
            'Atomicity (Tính nguyên tử) và Durability (Tính bền vững)',
            'Scalability (Khả năng mở rộng) và Security (Bảo mật)'
          ],
          correctIndex: 0,
          explanation: 'Đúng. Khi xảy ra Network Partition (mạng bị chia cắt giữa các nút), hệ thống phân tán chỉ có thể chọn: hoặc giữ Consistency (từ chối ghi khi các nút chưa đồng bộ, mất Availability), hoặc giữ Availability (chấp nhận phục vụ ghi dù dữ liệu tạm thời sai lệch, mất Consistency). Các lựa chọn khác không thuộc 3 thuộc tính của tam giác CAP.',
          sourceRef: 'Chương 1: Trang 1 - 3, mục Định lý CAP',
          keyConcepts: ['CAP Theorem', 'Partition Tolerance']
        },
        {
          id: 'q_s1_2',
          section: 'Chương 1: Nguyên lý cơ bản và Định lý CAP',
          topic: 'Eventual Consistency',
          question: 'Mô hình Eventual Consistency (Nhất quán cuối cùng) trong kiến trúc BASE phù hợp nhất với trường hợp nào sau đây?',
          options: [
            'Hệ thống mạng xã hội hiển thị lượt thích (Like) và bình luận của bài viết',
            'Giao dịch chuyển tiền liên ngân hàng theo thời gian thực',
            'Hệ thống kiểm soát tín hiệu phóng tên lửa quân sự',
            'Cơ chế cấp phát khóa tài nguyên phân tán (Distributed Mutex lock)'
          ],
          correctIndex: 0,
          explanation: 'Đúng. Lượt thích (Like) hay feed mạng xã hội ưu tiên cao nhất tính High Availability; dữ liệu đến chậm vài giây giữa các máy chủ người dùng vẫn chấp nhận được (Eventual Consistency). Chuyển tiền ngân hàng và khóa Mutex bắt buộc phải tuân theo Strict Consistency (hoặc Strong Consistency/ACID) để tránh Double Spending.',
          sourceRef: 'Chương 1: Trang 2, mô hình BASE và Eventual Consistency',
          keyConcepts: ['Eventual Consistency']
        },
        {
          id: 'q_s1_3',
          section: 'Chương 1: Nguyên lý cơ bản và Định lý CAP',
          topic: 'Định nghĩa Hệ thống phân tán',
          question: 'Đặc trưng cốt lõi nào KHÔNG PHẢI là tính chất mong muốn của một Hệ thống phân tán (Distributed System)?',
          options: [
            'Tất cả các nút dùng chung một vùng nhớ vật lý (Shared Memory Architecture)',
            'Tính trong suốt về vị trí (Location Transparency)',
            'Khả năng chịu lỗi từng phần (Partial Failure Resilience)',
            'Khả năng mở rộng theo chiều ngang (Horizontal Scalability)'
          ],
          correctIndex: 0,
          explanation: 'Đúng. Hệ thống phân tán truyền thống trao đổi qua thông điệp mạng (Message Passing) trên các máy tính độc lập, không dùng chung Shared Memory vật lý. Các đặc điểm còn lại (Location Transparency, Chịu lỗi từng phần, Mở rộng ngang) đều là tiêu chuẩn cốt lõi.',
          sourceRef: 'Chương 1: Trang 1, Khái niệm mở đầu',
          keyConcepts: ['Distributed System']
        }
      ]
    },
    {
      id: 'sec_2',
      index: 2,
      title: 'Chương 2: Giao tiếp giữa các Dịch vụ (RPC vs Message Broker)',
      content: 'Trong kiến trúc Microservices, giao tiếp giữa các dịch vụ có thể phân loại thành đồng bộ (Synchronous) và bất đồng bộ (Asynchronous). gRPC sử dụng giao thức HTTP/2 và cơ chế định dạng nhị phân Protocol Buffers (Protobuf), giúp giảm đáng kể Latency và kích thước payload so với REST API qua JSON. Tuy nhiên, gRPC tạo ra sự gắn kết chặt chẽ (Temporal Coupling). Để giải quyết bài toán tải cao và giải phóng tài nguyên, Message Broker như Apache Kafka hoặc RabbitMQ được ứng dụng theo mẫu Event-Driven Architecture, đảm bảo Loose Coupling và khả năng Backpressure buffering.',
      wordCount: 160,
      pageRange: 'Trang 4 - 6',
      keyConcepts: ['gRPC', 'Protocol Buffers', 'REST API', 'Message Broker', 'Apache Kafka', 'Event-Driven Architecture', 'Loose Coupling'],
      coveredConcepts: ['gRPC', 'Protocol Buffers', 'REST API', 'Message Broker', 'Apache Kafka', 'Event-Driven Architecture', 'Loose Coupling'],
      status: 'completed',
      questions: [
        {
          id: 'q_s2_1',
          section: 'Chương 2: Giao tiếp giữa các Dịch vụ (RPC vs Message Broker)',
          topic: 'So sánh gRPC và REST',
          question: 'Lợi thế kỹ thuật vượt trội nào khiến gRPC thường được ưu tiên hơn REST API cho giao tiếp nội bộ giữa các microservices (East-West traffic)?',
          options: [
            'Sử dụng Protocol Buffers nén nhị phân kết hợp đa ghép kênh (Multiplexing) trên nền HTTP/2',
            'Dễ dàng đọc và debug trực tiếp nội dung gói tin bằng mắt thường trong browser',
            'Không cần định nghĩa schema dữ liệu trước khi gửi',
            'Tự động hỗ trợ mã hóa SSL mà không cần chứng chỉ bảo mật'
          ],
          correctIndex: 0,
          explanation: 'Đúng. gRPC tuần tự hóa dữ liệu bằng nhị phân Protobuf nhỏ gọn hơn nhiều so với chuỗi văn bản JSON, kết hợp HTTP/2 multiplexing (truyền nhiều request đồng thời trên 1 kết nối TCP), tối ưu hóa độ trễ cực thấp. Đáp án dễ đọc mắt thường là ưu điểm của REST/JSON, không phải gRPC.',
          sourceRef: 'Chương 2: Trang 4 - 5, mục Phân tích gRPC vs REST',
          keyConcepts: ['gRPC', 'Protocol Buffers']
        },
        {
          id: 'q_s2_2',
          section: 'Chương 2: Giao tiếp giữa các Dịch vụ (RPC vs Message Broker)',
          topic: 'Tình huống sử dụng Message Broker',
          question: 'Kỹ thuật nào sau đây là giải pháp tối ưu nhất khi một dịch vụ xử lý hóa đơn phải đối mặt với lượng đơn hàng tăng đột biến (Traffic Spike) gấp 10 lần mà không muốn làm sập hệ thống?',
          options: [
            'Sử dụng Message Broker (như RabbitMQ/Kafka) làm bộ đệm bất đồng bộ (Buffering/Backpressure)',
            'Chuyển toàn bộ các lời gọi gRPC sang gọi đồng bộ Blocking REST API',
            'Tăng timeout của client lên vô hạn để chờ máy chủ phản hồi',
            'Thực hiện Retry ngay lập tức và liên tục không giới hạn (Aggressive Retry)'
          ],
          correctIndex: 0,
          explanation: 'Đúng. Message Broker đóng vai trò hàng đợi đệm (Queue/Buffer), nhận tải đột biến và cho phép các worker phía sau tiêu thụ dần theo năng lực (Rate Limiting/Backpressure), ngăn ngừa Cascading Failure. Gọi blocking REST hoặc aggressive retry sẽ làm trầm trọng thêm nghẽn mạng.',
          sourceRef: 'Chương 2: Trang 5 - 6, mục Kiến trúc hướng sự kiện',
          keyConcepts: ['Message Broker', 'Loose Coupling']
        },
        {
          id: 'q_s2_3',
          section: 'Chương 2: Giao tiếp giữa các Dịch vụ (RPC vs Message Broker)',
          topic: 'Khi nào KHÔNG nên dùng Message Broker',
          question: 'Trong trường hợp nào sau đây việc áp dụng Message Broker bất đồng bộ là KHÔNG PHÙ HỢP?',
          options: [
            'Tính năng xác thực mã OTP đăng nhập cần kết quả trả về ngay lập tức cho người dùng',
            'Gửi email thông báo đơn hàng sau khi thanh toán thành công',
            'Xử lý xuất báo cáo Excel kích thước lớn mất hơn 5 phút',
            'Đồng bộ dữ liệu sang kho tìm kiếm Elasticsearch cho tính năng Search'
          ],
          correctIndex: 0,
          explanation: 'Đúng. Xác thực OTP yêu cầu phản hồi tức thì (Synchronous Request-Response), người dùng đang chờ trên giao diện để đăng nhập ngay. Các tác vụ gửi email, xuất báo cáo nặng hoặc đồng bộ dữ liệu là ứng viên kinh điển cho xử lý bất đồng bộ nền (Background Processing).',
          sourceRef: 'Chương 2: Trang 6, mục Lựa chọn công nghệ giao tiếp',
          keyConcepts: ['Message Broker', 'Event-Driven Architecture']
        }
      ]
    },
    {
      id: 'sec_3',
      index: 3,
      title: 'Chương 3: Quản lý Giao dịch Phân tán (2PC vs Saga Pattern)',
      content: 'Trong cơ sở dữ liệu phân tán, việc duy trì ACID trên nhiều microservices độc lập là bài toán phức tạp. Giao thức Two-Phase Commit (2PC) gồm 2 giai đoạn: Prepare và Commit. Mặc dù đảm bảo Strong Consistency, 2PC là giao thức Blocking gây giảm sút nghiêm trọng Throughput và có nguy cơ điểm chết đơn lẻ (Single Point of Failure tại Coordinator). Ngược lại, Saga Pattern là chuỗi các Local Transactions. Mỗi bước thay đổi trạng thái sẽ gửi sự kiện. Nếu một bước thất bại, Saga kích hoạt các giao dịch đền bù (Compensating Transactions) theo thứ tự ngược lại để khôi phục trạng thái nhất quán cuối cùng.',
      wordCount: 155,
      pageRange: 'Trang 7 - 9',
      keyConcepts: ['Two-Phase Commit (2PC)', 'Saga Pattern', 'Compensating Transaction', 'ACID', 'Blocking Protocol', 'Coordinator'],
      coveredConcepts: ['Two-Phase Commit (2PC)', 'Saga Pattern', 'Compensating Transaction', 'ACID', 'Blocking Protocol', 'Coordinator'],
      status: 'completed',
      questions: [
        {
          id: 'q_s3_1',
          section: 'Chương 3: Quản lý Giao dịch Phân tán (2PC vs Saga Pattern)',
          topic: 'Compensating Transactions',
          question: 'Trong kiến trúc Saga Pattern, "Giao dịch đền bù" (Compensating Transaction) đóng vai trò gì khi một bước trong quy trình đặt hàng bị lỗi?',
          options: [
            'Đảo ngược ngữ nghĩa của các thao tác đã hoàn thành trước đó (ví dụ: hoàn tiền nếu trừ tiền rồi mà hết hàng)',
            'Tự động sao lưu toàn bộ cơ sở dữ liệu vật lý về thời điểm 00:00 sáng',
            'Khóa toàn bộ bảng dữ liệu trong suốt thời gian hệ thống kiểm tra lỗi',
            'Ép buộc hệ thống thử lại bước bị lỗi liên tục cho đến khi thành công'
          ],
          correctIndex: 0,
          explanation: 'Đúng. Vì các bước trong Saga đã commit vào database cục bộ của từng service (không thể Rollback vật lý như ACID đơn máy), hệ thống phải thực hiện thao tác nghiệp vụ bù đắp (Compensating Action) ngược lại để trả về trạng thái hợp lý (ví dụ: Unreserve Inventory, Refund Payment).',
          sourceRef: 'Chương 3: Trang 8, cơ chế Compensating Transactions trong Saga',
          keyConcepts: ['Saga Pattern', 'Compensating Transaction']
        },
        {
          id: 'q_s3_2',
          section: 'Chương 3: Quản lý Giao dịch Phân tán (2PC vs Saga Pattern)',
          topic: 'Nhược điểm của 2PC',
          question: 'Tại sao giao thức Two-Phase Commit (2PC) hiếm khi được sử dụng trong các hệ thống Microservices hiện đại quy mô lớn?',
          options: [
            'Bản chất Blocking giữ khóa tài nguyên lâu, làm giảm Throughput và dễ tắc nghẽn nếu Coordinator gặp sự cố',
            '2PC không thể hoạt động trên mạng TCP/IP thông thường',
            '2PC bắt buộc tất cả các máy chủ phải được cài đặt cùng một hệ điều hành',
            '2PC không đảm bảo được tính nhất quán dữ liệu ở bất kỳ thời điểm nào'
          ],
          correctIndex: 0,
          explanation: 'Đúng. 2PC yêu cầu tất cả các nút tham gia (Participants) giữ lock tài nguyên trong suốt giai đoạn Prepare và Commit. Nếu một nút mạng chậm hoặc Coordinator bị treo, toàn bộ hệ thống bị nghẽn (Resource Lock contention), triệt tiêu khả năng mở rộng quy mô lớn.',
          sourceRef: 'Chương 3: Trang 7 - 8, Đánh giá Two-Phase Commit',
          keyConcepts: ['Two-Phase Commit (2PC)', 'Blocking Protocol']
        }
      ]
    }
  ],
  questions: [], // will be populated
  coverageReport: {
    totalConcepts: 19,
    coveredConcepts: 19,
    coveragePercentage: 100,
    missingConcepts: [],
    allConcepts: [
      { section: 'Chương 1', concept: 'CAP Theorem', covered: true },
      { section: 'Chương 1', concept: 'Consistency', covered: true },
      { section: 'Chương 1', concept: 'Availability', covered: true },
      { section: 'Chương 1', concept: 'Partition Tolerance', covered: true },
      { section: 'Chương 1', concept: 'Eventual Consistency', covered: true },
      { section: 'Chương 1', concept: 'Distributed System', covered: true },
      { section: 'Chương 2', concept: 'gRPC', covered: true },
      { section: 'Chương 2', concept: 'Protocol Buffers', covered: true },
      { section: 'Chương 2', concept: 'REST API', covered: true },
      { section: 'Chương 2', concept: 'Message Broker', covered: true },
      { section: 'Chương 2', concept: 'Apache Kafka', covered: true },
      { section: 'Chương 2', concept: 'Event-Driven Architecture', covered: true },
      { section: 'Chương 2', concept: 'Loose Coupling', covered: true },
      { section: 'Chương 3', concept: 'Two-Phase Commit (2PC)', covered: true },
      { section: 'Chương 3', concept: 'Saga Pattern', covered: true },
      { section: 'Chương 3', concept: 'Compensating Transaction', covered: true },
      { section: 'Chương 3', concept: 'ACID', covered: true },
      { section: 'Chương 3', concept: 'Blocking Protocol', covered: true },
      { section: 'Chương 3', concept: 'Coordinator', covered: true },
    ]
  }
};

// Flatten all questions
SAMPLE_QUIZ_BANK.questions = SAMPLE_QUIZ_BANK.sections.flatMap(s => s.questions);
