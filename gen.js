'use strict';
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, TableOfContents, PageBreak, VerticalAlign, Header, Footer,
  PageNumber, NumberFormat
} = require('docx');
const fs = require('fs');

// ─── Palette & common styles ──────────────────────────────────────────────────
const C = { navy:'1F3864', blue:'2E4A8F', mid:'365F91', red:'C00000',
             gray:'595959', lite:'F2F2F2', head:'D5E8F0', code:'F5F5F5' };
const bd  = { style:BorderStyle.SINGLE, size:1, color:'CCCCCC' };
const bds = { top:bd, bottom:bd, left:bd, right:bd };
const cellMargins = { top:100, bottom:100, left:140, right:140 };

// ─── Paragraph helpers ────────────────────────────────────────────────────────
const SP = (before=0,after=200,line=280)=>({ before, after, line });

function h1(t){ return new Paragraph({
  heading:HeadingLevel.HEADING_1,
  children:[new TextRun({text:t,bold:true})]
}); }
function h2(t){ return new Paragraph({
  heading:HeadingLevel.HEADING_2,
  children:[new TextRun({text:t,bold:true})]
}); }
function h3(t){ return new Paragraph({
  heading:HeadingLevel.HEADING_3,
  children:[new TextRun({text:t,bold:true})]
}); }

function p(text, extra={}){
  return new Paragraph({
    alignment:AlignmentType.JUSTIFIED,
    spacing:SP(0,200,280),
    children:[new TextRun({text, font:'Times New Roman', size:24, ...extra})]
  });
}
function pB(text){ return p(text,{bold:true}); }

function pMixed(...runs){
  return new Paragraph({
    alignment:AlignmentType.JUSTIFIED,
    spacing:SP(0,200,280),
    children: runs.map(r => new TextRun({font:'Times New Roman',size:24,...r}))
  });
}

function code(text){
  return new Paragraph({
    spacing:SP(0,0,240),
    indent:{left:720},
    shading:{type:ShadingType.CLEAR, fill:C.code},
    children:[new TextRun({text, font:'Courier New', size:18, color:'1a1a1a'})]
  });
}
function codeComment(text){
  return new Paragraph({
    spacing:SP(0,0,240),
    indent:{left:720},
    shading:{type:ShadingType.CLEAR, fill:C.code},
    children:[new TextRun({text, font:'Courier New', size:18, color:'5a7a3a', italics:true})]
  });
}

function screenshot(desc){
  return new Paragraph({
    spacing:SP(120,120,280),
    alignment:AlignmentType.CENTER,
    border:{
      top:{style:BorderStyle.SINGLE,size:4,color:'2563eb'},
      bottom:{style:BorderStyle.SINGLE,size:4,color:'2563eb'},
      left:{style:BorderStyle.SINGLE,size:4,color:'2563eb'},
      right:{style:BorderStyle.SINGLE,size:4,color:'2563eb'},
    },
    shading:{type:ShadingType.CLEAR, fill:'EFF6FF'},
    children:[new TextRun({
      text:'\uD83D\uDCF8 SCREENSHOT GIAO DIEN: '+desc,
      bold:true, font:'Times New Roman', size:22, color:'1d4ed8'
    })]
  });
}

function bull(text, sub=false){
  return new Paragraph({
    numbering:{reference: sub?'sub-bullets':'bullets', level:0},
    spacing:SP(0,120,260),
    children:[new TextRun({text, font:'Times New Roman', size:24})]
  });
}
function num(text){
  return new Paragraph({
    numbering:{reference:'numbers',level:0},
    spacing:SP(0,120,260),
    children:[new TextRun({text, font:'Times New Roman', size:24})]
  });
}

function pb(){ return new Paragraph({children:[new PageBreak()]}); }
function em(){ return new Paragraph({children:[new TextRun('')], spacing:SP(0,80)}); }

function caption(text){
  return new Paragraph({
    alignment:AlignmentType.CENTER,
    spacing:SP(60,160,260),
    children:[new TextRun({text, font:'Times New Roman', size:22, italics:true, color:C.gray})]
  });
}

// ─── Table helpers ────────────────────────────────────────────────────────────
function mkCell(text, isHdr=false, w=2000, bg=null, italic=false){
  return new TableCell({
    borders:bds,
    width:{size:w, type:WidthType.DXA},
    margins:cellMargins,
    verticalAlign:VerticalAlign.CENTER,
    shading: bg ? {type:ShadingType.CLEAR, fill:bg}
               : (isHdr ? {type:ShadingType.CLEAR,fill:C.head} : undefined),
    children:[new Paragraph({
      alignment:AlignmentType.LEFT,
      children:[new TextRun({text, bold:isHdr, italics:italic,
                              font:'Times New Roman', size:22})]
    })]
  });
}
function mkTable(headers, rows, colWidths){
  const total = colWidths.reduce((a,b)=>a+b,0);
  return new Table({
    width:{size:total, type:WidthType.DXA},
    columnWidths:colWidths,
    rows:[
      new TableRow({children: headers.map((h,i)=>mkCell(h,true,colWidths[i]))}),
      ...rows.map(row=>new TableRow({
        children:row.map((c,i)=>typeof c==='object'
          ? mkCell(c.text,false,colWidths[i],c.bg,c.italic)
          : mkCell(c,false,colWidths[i]))
      }))
    ]
  });
}

// ─── Document ─────────────────────────────────────────────────────────────────
const doc = new Document({
  styles:{
    default:{
      document:{run:{font:'Times New Roman',size:24}},
      heading1:{run:{font:'Times New Roman'}},
      heading2:{run:{font:'Times New Roman'}},
      heading3:{run:{font:'Times New Roman'}},
    },
    paragraphStyles:[
      { id:'Heading1', name:'Heading 1', basedOn:'Normal', next:'Normal', quickFormat:true,
        run:{size:34,bold:true,font:'Times New Roman',color:C.navy},
        paragraph:{spacing:{before:480,after:240}, outlineLevel:0,
          border:{bottom:{style:BorderStyle.SINGLE,size:6,color:C.blue,space:4}}} },
      { id:'Heading2', name:'Heading 2', basedOn:'Normal', next:'Normal', quickFormat:true,
        run:{size:28,bold:true,font:'Times New Roman',color:C.blue},
        paragraph:{spacing:{before:360,after:200}, outlineLevel:1} },
      { id:'Heading3', name:'Heading 3', basedOn:'Normal', next:'Normal', quickFormat:true,
        run:{size:25,bold:true,font:'Times New Roman',color:C.mid},
        paragraph:{spacing:{before:260,after:160}, outlineLevel:2} },
    ]
  },
  numbering:{
    config:[
      { reference:'bullets', levels:[{
          level:0, format:LevelFormat.BULLET, text:'\u2022', alignment:AlignmentType.LEFT,
          style:{paragraph:{indent:{left:720,hanging:360}},
                 run:{font:'Symbol'}}}]},
      { reference:'sub-bullets', levels:[{
          level:0, format:LevelFormat.BULLET, text:'-', alignment:AlignmentType.LEFT,
          style:{paragraph:{indent:{left:1080,hanging:360}}}}]},
      { reference:'numbers', levels:[{
          level:0, format:LevelFormat.DECIMAL, text:'%1.', alignment:AlignmentType.LEFT,
          style:{paragraph:{indent:{left:720,hanging:360}}}}]},
      { reference:'alpha', levels:[{
          level:0, format:LevelFormat.LOWER_LETTER, text:'%1)', alignment:AlignmentType.LEFT,
          style:{paragraph:{indent:{left:720,hanging:360}}}}]},
    ]
  },
  sections:[{
    properties:{
      page:{
        size:{width:11906, height:16838},
        margin:{top:1417, right:1134, bottom:1417, left:1701}
      }
    },
    children:[

// ══════════════════════════════════════════════════════════════════════════════
//  TRANG BÌA
// ══════════════════════════════════════════════════════════════════════════════
new Paragraph({alignment:AlignmentType.CENTER, spacing:{before:0,after:120},
  children:[new TextRun({text:'HỌC VIỆN KỸ THUẬT MẬT MÃ',bold:true,size:26,font:'Times New Roman',allCaps:true})]}),
new Paragraph({alignment:AlignmentType.CENTER, spacing:{after:120},
  children:[new TextRun({text:'KHOA CÔNG NGHỆ THÔNG TIN',bold:true,size:26,font:'Times New Roman',allCaps:true})]}),
new Paragraph({alignment:AlignmentType.CENTER, spacing:{after:120},
  children:[new TextRun({text:'BỘ MÔN: CẤU TRÚC DỮ LIỆU VÀ GIẢI THUẬT',size:24,font:'Times New Roman'})]}),
em(), em(),
new Paragraph({alignment:AlignmentType.CENTER, spacing:{before:480,after:200},
  children:[new TextRun({text:'BÁO CÁO ĐỒ ÁN MÔN HỌC',bold:true,size:44,font:'Times New Roman',color:C.navy,allCaps:true})]}),
em(),
new Paragraph({alignment:AlignmentType.CENTER, spacing:{before:240,after:120},
  children:[new TextRun({text:'HỆ THỐNG ĐIỀU HƯỚNG VÀ TỐI ƯU HÓA',bold:true,size:36,font:'Times New Roman',color:C.red})]}),
new Paragraph({alignment:AlignmentType.CENTER, spacing:{after:80},
  children:[new TextRun({text:'LOGISTICS QUẬN 1, TP. HỒ CHÍ MINH',bold:true,size:36,font:'Times New Roman',color:C.red})]}),
new Paragraph({alignment:AlignmentType.CENTER, spacing:{after:480},
  children:[new TextRun({text:'(District 1 Logistics Navigation & Optimization System)',italics:true,size:24,font:'Times New Roman',color:C.gray})]}),
em(), em(),
new Paragraph({alignment:AlignmentType.CENTER, spacing:{after:120},
  children:[new TextRun({text:'Sinh viên thực hiện: ___________________________',size:24,font:'Times New Roman'})]}),
new Paragraph({alignment:AlignmentType.CENTER, spacing:{after:120},
  children:[new TextRun({text:'Mã số sinh viên: ___________________________',size:24,font:'Times New Roman'})]}),
new Paragraph({alignment:AlignmentType.CENTER, spacing:{after:120},
  children:[new TextRun({text:'Lớp: ___________________________',size:24,font:'Times New Roman'})]}),
new Paragraph({alignment:AlignmentType.CENTER, spacing:{after:120},
  children:[new TextRun({text:'Giảng viên hướng dẫn: ___________________________',size:24,font:'Times New Roman'})]}),
em(), em(),
new Paragraph({alignment:AlignmentType.CENTER, spacing:{before:480},
  children:[new TextRun({text:'TP. Hồ Chí Minh, năm 2025',size:24,font:'Times New Roman',bold:true})]}),
pb(),

// ══════════════════════════════════════════════════════════════════════════════
//  MỤC LỤC
// ══════════════════════════════════════════════════════════════════════════════
new Paragraph({alignment:AlignmentType.CENTER, spacing:{after:400},
  children:[new TextRun({text:'MỤC LỤC',bold:true,size:32,font:'Times New Roman',allCaps:true})]}),
new TableOfContents('Mục lục',{
  hyperlink:true, headingStyleRange:'1-3',
  stylesWithLevels:[
    {styleName:'Heading 1',level:1},
    {styleName:'Heading 2',level:2},
    {styleName:'Heading 3',level:3},
  ]
}),
pb(),

// ══════════════════════════════════════════════════════════════════════════════
//  CHƯƠNG 1 — TỔNG QUAN
// ══════════════════════════════════════════════════════════════════════════════
h1('CHƯƠNG 1. TỔNG QUAN DỰ ÁN'),

h2('1.1. Đặt vấn đề và bối cảnh thực tiễn'),
p('Quận 1, Thành phố Hồ Chí Minh là trung tâm kinh tế, tài chính và hành chính của thành phố. Khu vực này tập trung mật độ cao các công trình biểu tượng như Dinh Độc Lập, Nhà thờ Đức Bà, Tháp Bitexco, Chợ Bến Thành, Phố đi bộ Nguyễn Huệ, Bến Bạch Đằng và hàng loạt trung tâm thương mại, khách sạn quốc tế. Đây cũng là khu vực có mật độ giao thông thuộc hàng cao nhất thành phố, với đặc điểm nổi bật là mạng lưới đường phố hỗn hợp: nhiều tuyến một chiều, giao lộ phức tạp, và các điểm nút thường xuyên xảy ra ùn tắc.'),
p('Trong bối cảnh đó, bài toán tối ưu hóa lộ trình cho các doanh nghiệp Logistics hoạt động trong khu vực là vô cùng thực tiễn. Một xe giao hàng cần đến nhiều điểm trong cùng một chuyến không chỉ phải biết đường đi ngắn nhất hoặc nhanh nhất giữa từng cặp điểm, mà còn phải xác định thứ tự thăm các điểm sao cho tổng chi phí toàn hành trình là nhỏ nhất. Đây chính là hai vấn đề cốt lõi mà đồ án này hướng đến giải quyết: bài toán Đường đi ngắn nhất (Shortest Path) và bài toán Người giao hàng (Traveling Salesman Problem — TSP).'),
p('Thêm vào đó, môi trường giao thông thực tế là động: một tuyến đường có thể bị phong tỏa bất kỳ lúc nào do thi công, sự cố hoặc sự kiện đặc biệt. Hệ thống cần phản ứng ngay lập tức với sự thay đổi này mà không cần khởi động lại hay tải lại dữ liệu — đây là yêu cầu của tính năng Block Road động.'),

h2('1.2. Mục tiêu và phạm vi'),
p('Đồ án xây dựng một hệ thống phần mềm hoàn chỉnh gồm hai thành phần liên thông chặt chẽ:'),
bull('Lõi giải thuật (Algorithm Core): Cài đặt từ đầu bằng Pure Java 21 — bao gồm đồ thị có hướng với Danh sách kề, thuật toán Dijkstra O(E log V) với Priority Queue, và thuật toán TSP Backtracking với chiến lược cắt tỉa nhánh (Pruning). Không sử dụng bất kỳ thư viện đồ thị bên ngoài nào.'),
bull('Giao diện Web tương tác (Interactive Web UI): Web Server thuần Java (com.sun.net.httpserver), phục vụ giao diện bản đồ Leaflet.js trên nền dữ liệu địa lý thực của Quận 1 với khả năng trực quan hóa lộ trình và log thuật toán theo thời gian thực.'),
em(),
p('Đồ án không chỉ giải quyết bài toán kỹ thuật mà còn nhấn mạnh vào khía cạnh giáo dục: hệ thống Algorithm Tracing hiển thị từng bước hoạt động của Dijkstra và TSP trực tiếp trên giao diện, giúp người dùng hiểu cơ chế bên trong của các giải thuật.'),

h2('1.3. Kiến trúc tổng thể hệ thống'),
p('Hệ thống được thiết kế theo kiến trúc phân lớp rõ ràng, đảm bảo tách biệt trách nhiệm (Separation of Concerns) giữa các thành phần:'),
em(),
mkTable(
  ['Lớp','Thành phần','Trách nhiệm'],
  [
    ['Data Layer','Node, Edge, Graph, WeightMode','Biểu diễn cấu trúc đồ thị, quản lý trạng thái'],
    ['I/O Layer','CsvMapLoader, AppException','Đọc dữ liệu bản đồ, xử lý ngoại lệ'],
    ['Service Layer','DijkstraService, TspService','Triển khai thuật toán, trả kết quả DTO'],
    ['Web Layer','WebServer, *Handler classes','Expose REST API, xử lý HTTP request/response'],
    ['Frontend','index.html + Leaflet.js','Giao diện bản đồ tương tác, hiển thị kết quả'],
  ],
  [1800,2600,4000]
),
em(),
p('Trục kết nối chính là đối tượng Graph — được khởi tạo một lần khi ứng dụng khởi động từ file CSV, sau đó được chia sẻ (shared state) giữa tất cả Handler class. Thiết kế này đảm bảo tính nhất quán của trạng thái Block Road: khi một Handler thay đổi trạng thái cạnh, mọi request tiếp theo đều phản ánh thay đổi đó ngay lập tức.'),

h2('1.4. Môi trường kỹ thuật và ràng buộc'),
em(),
mkTable(
  ['Tiêu chí','Lựa chọn','Lý do'],
  [
    ['Ngôn ngữ lập trình','Java 21 (LTS)','Hỗ trợ Virtual Threads (Project Loom), Pattern Matching, Records'],
    ['Build tool','Gradle 8.x','Linh hoạt, hỗ trợ tốt Java Toolchain'],
    ['HTTP Server','com.sun.net.httpserver (JDK built-in)','Không phụ thuộc framework, kiểm soát hoàn toàn'],
    ['Bản đồ frontend','Leaflet.js 1.9.4 (CDN)','Nhẹ, mã nguồn mở, tile OpenStreetMap miễn phí'],
    ['Định dạng dữ liệu bản đồ','CSV 11 cột với tọa độ GPS','Đơn giản, dễ chỉnh sửa thủ công, không cần parser ngoài'],
    ['Thư viện đồ thị ngoài','Không sử dụng','Yêu cầu đồ án: tự xây dựng toàn bộ cấu trúc dữ liệu'],
    ['Phạm vi dữ liệu','22 địa điểm, ~60 cạnh','Đủ để minh họa, đủ nhỏ để kiểm thử tay'],
  ],
  [2200,2400,4000]
),
em(),
pb(),

// ══════════════════════════════════════════════════════════════════════════════
//  CHƯƠNG 2 — CẤU TRÚC DỮ LIỆU
// ══════════════════════════════════════════════════════════════════════════════
h1('CHƯƠNG 2. THIẾT KẾ CẤU TRÚC DỮ LIỆU'),

h2('2.1. Mô hình hóa mạng lưới đường phố'),
p('Mạng lưới đường phố được ánh xạ thành đồ thị có hướng có trọng số G = (V, E, w) trong đó:'),
bull('V là tập hợp hữu hạn các đỉnh (vertices), mỗi đỉnh đại diện cho một địa điểm địa lý.'),
bull('E ⊆ V × V là tập hợp các cạnh có hướng (directed edges), mỗi cạnh (u, v) đại diện cho một đoạn đường cho phép di chuyển từ u đến v.'),
bull('w: E → ℝ⁺ là hàm trọng số, gán cho mỗi cạnh một giá trị dương — khoảng cách (mét) hoặc thời gian di chuyển (giây) tùy theo chế độ hoạt động.'),
em(),
p('Lý do chọn đồ thị có hướng thay vì vô hướng: Quận 1 có nhiều tuyến đường một chiều (ví dụ: Diamond Plaza → Vincom Center là một chiều, chiều ngược lại không được phép). Nếu mô hình hóa bằng đồ thị vô hướng, các ràng buộc giao thông này bị bỏ qua, dẫn đến kết quả lộ trình không hợp lệ trong thực tế.'),
p('Đường hai chiều được biểu diễn bằng hai cạnh có hướng đối nhau: (u,v) và (v,u), mỗi cạnh có thể có trọng số khác nhau nếu điều kiện giao thông khác nhau giữa hai chiều.'),

h2('2.2. Lựa chọn Danh sách kề (Adjacency List)'),
p('Hai biểu diễn phổ biến cho đồ thị là Ma trận kề (Adjacency Matrix) và Danh sách kề (Adjacency List). Quyết định thiết kế được phân tích dưới đây:'),
em(),
mkTable(
  ['Tiêu chí','Danh sách kề','Ma trận kề'],
  [
    ['Bộ nhớ','O(V + E)','O(V²)'],
    ['Kiểm tra cạnh (u,v) tồn tại','O(degree(u))','O(1)'],
    ['Duyệt cạnh kề của u','O(degree(u))','O(V)'],
    ['Phù hợp với đồ thị thưa','Tối ưu','Lãng phí'],
    ['Với V=22, E=60','22+60=82 ô nhớ','22×22=484 ô nhớ (87% rỗng)'],
    ['Phù hợp với Dijkstra','Rất phù hợp','Kém hơn'],
  ],
  [2400,2600,2600]
),
em(),
p('Với dataset Quận 1 (V=22, E≈60), đồ thị rất thưa: mật độ cạnh E/(V×V) ≈ 60/484 ≈ 12.4%. Danh sách kề tiết kiệm bộ nhớ đáng kể và quan trọng hơn, thuật toán Dijkstra chỉ cần duyệt các cạnh kề thực sự của mỗi đỉnh — không lãng phí thời gian kiểm tra các ô rỗng như với ma trận.'),

h2('2.3. Thiết kế lớp Node và cấu trúc Adjacency List'),
p('Mỗi đỉnh được biểu diễn bởi lớp Node với năm trường thông tin cốt lõi: định danh duy nhất (id), tên hiển thị (name), tọa độ địa lý (latitude, longitude) và danh sách cạnh đi ra (adjacencyList). Việc nhúng adjacencyList trực tiếp vào đối tượng Node — thay vì quản lý tập trung trong Graph — cho phép truy xuất các cạnh kề của một đỉnh với độ phức tạp O(1): chỉ cần một lần tra cứu HashMap để lấy đối tượng Node, sau đó truy cập trường adjacencyList trực tiếp.'),
p('Phương thức getEdges() trả về Collections.unmodifiableList() — một wrapper không thể biến đổi — bảo vệ tính toàn vẹn của đồ thị: code bên ngoài không thể vô tình thêm/xóa cạnh mà không đi qua API của Graph.'),

h2('2.4. Lớp Edge và cơ chế tính trọng số hai chế độ'),
p('Lớp Edge biểu diễn một cạnh có hướng với bốn thuộc tính: đỉnh đích (toNodeId), khoảng cách tính bằng mét (distanceMeters), vận tốc di chuyển trung bình tính bằng km/h (speedKmh) và cờ trạng thái blocked. Thiết kế quan trọng nhất là phương thức getWeight(WeightMode):'),
em(),
code('public double getWeight(WeightMode mode) {'),
code('    return switch (mode) {'),
code('        case DISTANCE -> distanceMeters;'),
code('        case TIME     -> distanceMeters / (speedKmh * 1000.0 / 3600.0);'),
code('    };'),
code('}'),
em(),
p('Khi mode = TIME, trọng số được tính theo công thức vật lý t = d/v trong đó vận tốc được quy đổi từ km/h sang m/s: v(m/s) = speedKmh × (1000/3600). Kết quả là thời gian di chuyển tính bằng giây. Thiết kế này cho phép toàn bộ thuật toán Dijkstra hoạt động thống nhất cho cả hai chế độ mà không cần bất kỳ sửa đổi logic nào — chỉ cần truyền mode vào hàm getWeight().'),
p('Cờ blocked là trường có thể thay đổi (mutable) duy nhất trong cấu trúc dữ liệu. Phương thức isTraversable() = !blocked được Dijkstra kiểm tra tại mỗi bước duyệt cạnh để bỏ qua các cạnh đang bị chặn. Cơ chế này cho phép tính năng Block Road hoạt động theo thời gian thực mà không cần xây dựng lại đồ thị.'),

h2('2.5. Lớp Graph — Giao diện thao tác đồ thị'),
p('Graph đóng gói HashMap<String, Node> nodes là trường private duy nhất, đảm bảo toàn bộ truy cập phải đi qua API công khai. Các thao tác quan trọng:'),
em(),
mkTable(
  ['Phương thức','Độ phức tạp','Mô tả'],
  [
    ['addNode(id, name, lat, lng)','O(1) amortized','Thêm đỉnh; nếu đã tồn tại thì cập nhật tên và tọa độ'],
    ['addEdge(fromId, toId, ...)','O(1) amortized','Thêm cạnh; tự động thêm chiều ngược nếu !isOneWay'],
    ['getNode(id)','O(1)','Tra cứu đỉnh theo ID; ném AppException nếu không tồn tại'],
    ['containsNode(id)','O(1)','Kiểm tra đỉnh tồn tại — không ném exception'],
    ['getAllNodeIds()','O(1)','Trả về unmodifiable Set của tất cả ID đỉnh'],
    ['getAdjacentEdges(nodeId)','O(1)','Trả về copy của adjacencyList — tránh leak reference'],
    ['blockEdge(fromId, toId)','O(degree(fromId))','Tìm cạnh trong adjacencyList, set blocked=true'],
    ['unblockEdge(fromId, toId)','O(degree(fromId))','Tương tự, set blocked=false'],
  ],
  [2600,2000,4000]
),
em(),
p('Phương thức addNode() dùng computeIfAbsent() để đảm bảo idempotency: gọi nhiều lần với cùng một ID không tạo ra bản sao, chỉ cập nhật thông tin. Điều này quan trọng vì CsvMapLoader gọi addNode() cho cả đỉnh nguồn lẫn đỉnh đích của mỗi cạnh — một đỉnh có thể xuất hiện trong nhiều dòng CSV.'),

h2('2.6. Mô hình dữ liệu CSV và quy trình nạp bản đồ'),
p('File district1_map_v2.csv định nghĩa bản đồ theo định dạng Edge List với 11 cột, nhúng trực tiếp tọa độ GPS vào từng dòng dữ liệu:'),
em(),
mkTable(
  ['Chỉ số cột','Tên trường','Kiểu dữ liệu','Ý nghĩa'],
  [
    ['0','from_id','String','Mã định danh đỉnh xuất phát'],
    ['1','to_id','String','Mã định danh đỉnh đích'],
    ['2','from_name','String','Tên hiển thị đỉnh xuất phát'],
    ['3','to_name','String','Tên hiển thị đỉnh đích'],
    ['4','distance_m','double','Khoảng cách đoạn đường (mét)'],
    ['5','speed_kmh','double','Vận tốc di chuyển trung bình (km/h)'],
    ['6','is_oneway','boolean','true = đường một chiều'],
    ['7','from_lat','double','Vĩ độ GPS đỉnh xuất phát'],
    ['8','from_lng','double','Kinh độ GPS đỉnh xuất phát'],
    ['9','to_lat','double','Vĩ độ GPS đỉnh đích'],
    ['10','to_lng','double','Kinh độ GPS đỉnh đích'],
  ],
  [1200,1600,1600,4200]
),
em(),
p('Bốn cột tọa độ GPS (7–10) phục vụ hai mục đích kép: (1) khởi tạo đối tượng Node với vị trí địa lý chính xác, và (2) trực tiếp cung cấp dữ liệu cho API /api/nodes và /api/edges để Leaflet.js vẽ Marker và Polyline trên bản đồ thực mà không cần bước chuyển đổi tọa độ nào thêm.'),
p('CsvMapLoader thực hiện đọc file theo quy trình: bỏ qua dòng trống và dòng comment (bắt đầu bằng #), bỏ qua dòng header đầu tiên, parse từng dòng dữ liệu và kiểm tra hợp lệ (đủ cột, số không âm). Dòng lỗi được log Warning và bỏ qua thay vì ném exception — đảm bảo một dòng lỗi không phá hỏng toàn bộ quá trình nạp bản đồ.'),
em(),
screenshot('Toàn bộ bản đồ Quận 1 sau khi load — 22 CircleMarker xanh lam tại đúng vị trí GPS, các cạnh xám nối các điểm, zoom level 15 tập trung vào khu vực Quận 1'),
caption('Hình 2.1. Bản đồ Quận 1 được khởi tạo từ file district1_map_v2.csv'),
em(),
pb(),

// ══════════════════════════════════════════════════════════════════════════════
//  CHƯƠNG 3 — DIJKSTRA
// ══════════════════════════════════════════════════════════════════════════════
h1('CHƯƠNG 3. THUẬT TOÁN DIJKSTRA — TÌM ĐƯỜNG TỐI ƯU'),

h2('3.1. Nền tảng lý thuyết và tính đúng đắn'),
p('Thuật toán Dijkstra, được Edsger W. Dijkstra công bố năm 1959, giải quyết bài toán Single-Source Shortest Path (SSSP) trên đồ thị có trọng số không âm. Thuật toán hoạt động theo nguyên tắc Tham lam (Greedy): tại mỗi bước, chọn đỉnh chưa được thăm có ước tính chi phí từ nguồn nhỏ nhất để xử lý tiếp theo.'),
p('Tính đúng đắn được đảm bảo bởi Bổ đề nới lỏng tối ưu (Optimal Substructure Lemma): nếu đường đi ngắn nhất từ s đến t đi qua đỉnh trung gian u, thì đoạn đường từ s đến u trên đường đó cũng là đường đi ngắn nhất từ s đến u. Kết hợp với điều kiện trọng số không âm, bổ đề này đảm bảo rằng một khi một đỉnh được "xác nhận" (lấy ra từ hàng đợi ưu tiên và đánh dấu visited), chi phí ước tính của nó đã là tối ưu và sẽ không bao giờ được cải thiện thêm.'),

h2('3.2. Cấu trúc dữ liệu PriorityQueue và Min Binary Heap'),
p('Thành phần then chốt quyết định độ phức tạp của Dijkstra là cấu trúc dữ liệu dùng để chọn đỉnh tiếp theo cần xử lý. Java cung cấp lớp PriorityQueue<E> — một cài đặt của Min Binary Heap — với các tính chất toán học quan trọng:'),

h3('3.2.1. Cấu trúc và tính chất Min Binary Heap'),
p('Min Binary Heap là cây nhị phân gần đầy đủ (nearly complete binary tree) được lưu trữ trong mảng, thỏa mãn tính chất Heap: giá trị của mỗi nút không lớn hơn giá trị của các con nó. Với mảng có chỉ số bắt đầu từ 1, nút tại vị trí i có con trái tại 2i và con phải tại 2i+1.'),
p('Các thao tác quan trọng và độ phức tạp:'),
em(),
mkTable(
  ['Thao tác','Cơ chế','Độ phức tạp'],
  [
    ['offer(e) — Thêm phần tử','Thêm vào cuối mảng, sift-up (bubble-up) để khôi phục tính chất heap','O(log n)'],
    ['poll() — Lấy phần tử nhỏ nhất','Lấy phần tử gốc, đưa phần tử cuối lên gốc, sift-down','O(log n)'],
    ['peek() — Xem phần tử nhỏ nhất','Truy cập trực tiếp phần tử gốc','O(1)'],
    ['Xây heap từ n phần tử','Heapify — áp dụng sift-down từ dưới lên','O(n)'],
  ],
  [2200,4000,2000]
),
em(),
p('Trong hệ thống, PriorityQueue được khởi tạo với Comparator so sánh theo giá trị chi phí (cost) của Map.Entry<String, Double>. Mỗi entry là một cặp (nodeId, currentCost) — đỉnh nào có chi phí nhỏ nhất sẽ được poll() đầu tiên.'),

h3('3.2.2. Tại sao không dùng Sorted Set hay LinkedList?'),
p('LinkedList với tìm kiếm tuyến tính có độ phức tạp O(V) cho mỗi lần chọn đỉnh tối thiểu, dẫn đến tổng O(V²). TreeSet (Red-Black Tree) cho phép find-min trong O(log V) nhưng yêu cầu khóa phải là duy nhất — với đồ thị, hai đỉnh khác nhau có thể có cùng chi phí, dẫn đến va chạm khóa. Binary Heap là lựa chọn tốt nhất cho bài toán này vì: hỗ trợ find-min trong O(1), insert và delete-min trong O(log n), và không yêu cầu tính duy nhất của giá trị.'),

h2('3.3. Phân tích toán học quá trình Nới lỏng cạnh (Relaxation)'),
p('Relaxation là thao tác trung tâm của Dijkstra. Khi xử lý đỉnh u, với mỗi cạnh e = (u, v) có trọng số w(u,v), thuật toán thực hiện kiểm tra:'),
em(),
p('     Nếu dist[u] + w(u,v) < dist[v]  →  thực hiện Relaxation', {italics:true}),
p('     dist[v] ← dist[u] + w(u,v)      và  prev[v] ← u', {italics:true}),
em(),
p('Ý nghĩa hình học: dist[v] là ước tính "tốt nhất hiện tại" về chi phí từ nguồn s đến v. Relaxation cập nhật ước tính này nếu tìm thấy đường đi qua u tốt hơn đường đi đã biết. Thuật toán Dijkstra đảm bảo rằng khi u được poll() từ PQ, dist[u] đã là tối ưu tuyệt đối — do đó mọi Relaxation từ u sẽ dựa trên một giá trị chính xác.'),
p('Bất biến thuật toán (Algorithm Invariant): sau mỗi vòng lặp, với mọi đỉnh v đã được visited, dist[v] là chi phí đường đi ngắn nhất thực sự từ s đến v. Bất biến này được duy trì bởi điều kiện trọng số không âm: một đỉnh đã visited không thể được cải thiện thêm.'),

h2('3.4. Phân tích sai số số thực và hằng số COST_TOLERANCE'),
p('Trong cài đặt thực tế, phép so sánh số thực dấu chấm động (floating-point) tiềm ẩn nguy cơ lỗi do sai số biểu diễn. Hệ thống IEEE 754 double precision có độ chính xác khoảng 15–17 chữ số thập phân, nhưng phép cộng liên tiếp tích lũy sai số theo từng bước.'),
p('Xét tình huống cụ thể: hai đường đi P1 và P2 có cùng chi phí lý thuyết là 1500.0m. Nhưng do tích lũy sai số dấu chấm động qua nhiều phép cộng, kết quả tính toán có thể là 1500.0000000001 và 1499.9999999999. Nếu so sánh nghiêm ngặt, thuật toán sẽ liên tục "cải thiện" từ đường này sang đường kia, gây ra vòng lặp vô hạn hoặc thêm entry trùng lặp vào PQ.'),
p('Hằng số COST_TOLERANCE = 1e-9 giải quyết vấn đề này bằng cách thêm ngưỡng dung sai vào phép so sánh:'),
em(),
code('// Kiểm tra entry cũ (stale): chi phí trong PQ > chi phí đã biết tốt hơn'),
code('if (cost > dist.get(nodeId) + COST_TOLERANCE) { continue; }'),
em(),
code('// Relaxation: chỉ cập nhật nếu thực sự tốt hơn đáng kể'),
code('if (newCost + COST_TOLERANCE < oldCost) { /* cập nhật */ }'),
em(),
p('Giá trị 1e-9 (một phần tỷ) được chọn vì: (1) nhỏ hơn nhiều so với đơn vị đo lường nhỏ nhất có nghĩa trong bài toán (1 mét hoặc 1 giây), nên không ảnh hưởng đến tính chính xác của kết quả; (2) lớn hơn sai số tích lũy điển hình của IEEE 754 qua vài chục phép cộng, đảm bảo loại bỏ hiệu quả các so sánh giả.'),

h2('3.5. Cơ chế Lazy Deletion — Tối ưu hiệu năng'),
p('Cấu trúc Binary Heap của Java không hỗ trợ thao tác decrease-key (giảm khóa của một phần tử đang có trong heap) — đây là thao tác cần thiết trong cài đặt Dijkstra "lý tưởng" với Fibonacci Heap. Thay vào đó, hệ thống dùng kỹ thuật Lazy Deletion (xóa lười):'),
p('Khi dist[v] được cải thiện, một entry mới (v, newCost) được thêm vào PQ bằng offer(). Entry cũ (v, oldCost) vẫn còn trong PQ nhưng không bị xóa ngay — đây là "entry cũ" (stale entry). Khi entry cũ được poll() sau này, hai điều kiện sẽ phát hiện và loại bỏ nó:'),
em(),
p('Điều kiện 1: Nếu cost > dist[nodeId] + ε → entry này lỗi thời, dist đã được cập nhật bởi entry mới tốt hơn.'),
p('Điều kiện 2: Nếu visited.contains(nodeId) → đỉnh này đã được xử lý chính thức, mọi entry tiếp theo đều dư thừa.'),
em(),
p('Hệ quả trên hiệu năng: với kỹ thuật Lazy Deletion, số phần tử trong PQ có thể lên tới O(E) thay vì O(V). Do đó mỗi thao tác poll()/offer() tốn O(log E) thay vì O(log V). Tuy nhiên vì E = O(V²) trong trường hợp xấu nhất, log E = O(log V²) = O(2 log V) = O(log V) — độ phức tạp tổng thể không thay đổi: O(E log V).'),

h2('3.6. Truy vết đường đi (Path Reconstruction)'),
p('Mảng prev[] (Map<String,String>) lưu lại "đỉnh cha" của mỗi đỉnh trên đường đi ngắn nhất: prev[v] = u có nghĩa là trên đường đi tối ưu từ s, đỉnh v được đến từ u. Đường đi được tái tạo bằng cách đi ngược từ target về source:'),
em(),
code('LinkedList<String> path = new LinkedList<>();'),
code('String cursor = targetId;'),
code('while (cursor != null) {'),
code('    path.addFirst(cursor);   // addFirst() để khỏi đảo ngược sau'),
code('    if (cursor.equals(sourceId)) break;'),
code('    cursor = prev.get(cursor);'),
code('}'),
em(),
p('Việc dùng LinkedList.addFirst() thay vì ArrayList rồi Collections.reverse() giảm một lần duyệt O(V). Kết quả là List<String> theo thứ tự source → ... → target, sẵn sàng để enrich tọa độ GPS và trả về API.'),
p('Nếu dist[target] = Double.MAX_VALUE sau khi thuật toán kết thúc, nghĩa là không tồn tại đường đi từ source đến target trong đồ thị hiện tại (có thể do đồ thị không liên thông, hoặc tất cả đường kết nối đã bị block). Hệ thống trả về RouteResult.noPath() với đầy đủ execution steps để người dùng có thể hiểu lý do.'),

h2('3.7. Hệ thống Algorithm Tracing — Minh bạch hóa thuật toán'),
p('DijkstraService thu thập log thực thi (execution steps) theo từng bước và trả về cùng với kết quả đường đi. Hệ thống log được thiết kế có cấu trúc phân cấp để dễ đọc:'),
em(),
mkTable(
  ['Prefix log','Ý nghĩa','Ví dụ'],
  [
    ['* [Thăm]','Đỉnh được lấy từ PQ và xử lý','* [Thăm] Diamond Plaza (Cost: 450 m)'],
    ['> [Relax]','Cạnh được relaxed — tìm thấy đường tốt hơn','  > [Relax] Vincom Center: ∞ -> 800 m'],
    ['x [Skip]','Cạnh bị bỏ qua — không cải thiện','  x [Skip] Hồ Con Rùa: 950 m >= 850 m'],
    ['> [Đích]','Đỉnh đích được thăm, dừng sớm','> [Đích] Tháp Bitexco. Dừng thuật toán.'],
    ['> [Kết quả]','Tổng hợp cuối cùng','> [Kết quả] Tổng: 1200 m'],
  ],
  [1800,2600,4800]
),
em(),
screenshot('Tab "Tìm đường" sau khi tìm kết quả: sidebar trái hiển thị dropdown chọn điểm, chế độ Distance/Time, và bảng log thuật toán với các bước [Thăm]/[Relax]/[Skip] được định dạng màu sắc khác nhau. Bản đồ bên phải hiển thị Polyline xanh dương kết nối các điểm trên đường đi.'),
caption('Hình 3.1. Giao diện tìm đường Dijkstra với Algorithm Tracing'),
em(),

h2('3.8. Phân tích độ phức tạp đầy đủ'),
em(),
mkTable(
  ['Thao tác','Số lần','Chi phí đơn vị','Tổng'],
  [
    ['Khởi tạo dist[] cho V đỉnh','O(V)','O(1)','O(V)'],
    ['offer() vào PQ (mỗi relaxation)','O(E)','O(log E) = O(log V)','O(E log V)'],
    ['poll() từ PQ','O(E) (với lazy deletion)','O(log E) = O(log V)','O(E log V)'],
    ['Kiểm tra visited','O(V)','O(1) (HashSet)','O(V)'],
    ['Duyệt cạnh kề của mỗi đỉnh','∑ degree(v) = O(E)','O(1)','O(E)'],
    ['Path reconstruction','O(V)','O(1)','O(V)'],
    ['TỔNG CỘNG','—','—','O(E log V)'],
  ],
  [2600,1800,2200,2600]
),
em(),
p('Với dataset Quận 1 (V=22, E≈60): E log V ≈ 60 × log₂(22) ≈ 60 × 4.46 ≈ 268 phép toán cơ bản. Thời gian thực thi thực tế đo được dưới 1 mili-giây — hoàn toàn đáp ứng yêu cầu phản hồi tức thì của giao diện Web.'),
pb(),

// ══════════════════════════════════════════════════════════════════════════════
//  CHƯƠNG 4 — TSP
// ══════════════════════════════════════════════════════════════════════════════
h1('CHƯƠNG 4. THUẬT TOÁN TSP — NGƯỜI GIAO HÀNG'),

h2('4.1. Bài toán TSP và tính NP-Hard'),
p('Bài toán Người giao hàng (Traveling Salesman Problem — TSP) phát biểu như sau: cho n điểm và chi phí di chuyển giữa mỗi cặp điểm, hãy tìm chu trình (bắt đầu và kết thúc tại cùng một điểm) đi qua tất cả các điểm đúng một lần với tổng chi phí nhỏ nhất.'),
p('TSP thuộc lớp bài toán NP-Hard — lớp khó nhất trong lý thuyết độ phức tạp. Điều này có nghĩa là: (1) không có thuật toán đa thức nào được biết để giải TSP chính xác trong trường hợp tổng quát, và (2) mọi bài toán trong lớp NP đều có thể được rút gọn về TSP trong thời gian đa thức. Hiện tại, không ai biết liệu P = NP hay không — đây là một trong những bài toán mở nổi tiếng nhất của khoa học máy tính.'),

h3('4.1.1. Sự bùng nổ tổ hợp'),
p('Với n điểm giao hàng và 1 depot cố định, số chu trình phân biệt cần xem xét là (n-1)! — đây là con số tăng nhanh kinh khủng:'),
em(),
mkTable(
  ['Số điểm giao (n)','Số chu trình cần xét','Thời gian (giả sử 10⁸ phép/giây)'],
  [
    ['3','2! = 2','< 0.001 ms'],
    ['4','3! = 6','< 0.001 ms'],
    ['5','4! = 24','< 0.001 ms'],
    ['10','9! = 362.880','3.6 ms'],
    ['15','14! = 87.178.291.200','14.5 phút'],
    ['20','19! ≈ 1.2 × 10¹⁷','38.000 năm'],
  ],
  [2000,2600,4600]
),
em(),
p('Với ràng buộc n ≤ 5 của đồ án, số hoán vị tối đa là 4! = 24 — hoàn toàn khả thi cho thuật toán Backtracking chính xác. Đây là lý do tại sao đồ án giới hạn số điểm giao hàng trong khoảng 3–5: vượt quá ngưỡng này, Backtracking thuần túy sẽ không còn thực tế.'),

h2('4.2. Xây dựng Ma trận Chi phí (Cost Matrix)'),
p('Trước khi chạy Backtracking, TspService phải xây dựng ma trận chi phí D[n+1][n+1] trong đó n là số điểm giao hàng và điểm 0 là depot. Phần tử D[i][j] là chi phí đường đi tối ưu từ điểm i đến điểm j, được tính bằng thuật toán Dijkstra.'),

h3('4.2.1. Quy trình xây dựng ma trận'),
p('Với allPoints = [depot, delivery₁, delivery₂, ..., deliveryₙ]:'),
num('Vòng lặp ngoài i = 0..n, vòng lặp trong j = 0..n, i ≠ j.'),
num('Gọi DijkstraService.findRoute(graph, allPoints[i], allPoints[j], mode).'),
num('Nếu !isReachable → ném AppException (đồ thị không liên thông → TSP vô nghiệm).'),
num('D[i][j] = result.getTotalCost().'),
em(),
p('Đặc điểm quan trọng của ma trận D: do đồ thị có hướng với tốc độ có thể khác nhau giữa hai chiều, D không nhất thiết đối xứng — D[i][j] ≠ D[j][i] trong nhiều trường hợp. Ví dụ: đường từ Diamond Plaza → Vincom Center là đường một chiều nên D[DP][VCC] có giá trị, nhưng D[VCC][DP] phải đi vòng đường khác và có chi phí cao hơn.'),
p('Số lần gọi Dijkstra để xây ma trận: (n+1) × n = n(n+1) lần. Với n = 5: 30 lần Dijkstra. Với độ phức tạp O(E log V) mỗi lần, tổng chi phí xây ma trận là O(n² × E log V) — vẫn rất nhanh với dataset nhỏ.'),
em(),
screenshot('Tab "Giao hàng TSP" trên sidebar: dropdown chọn Kho xuất phát (Depot), 3 dropdown chọn điểm giao hàng được điền với các địa điểm thực tế, nút "+ Thêm điểm", chọn chế độ Ngắn nhất/Nhanh nhất, nút "Tối ưu lộ trình"'),
caption('Hình 4.1. Giao diện nhập liệu bài toán TSP'),
em(),

h2('4.3. Thuật toán Backtracking với cấu trúc trạng thái'),
p('Sau khi có ma trận D, bài toán TSP được giải bằng Backtracking — một chiến lược tìm kiếm có hệ thống trong không gian trạng thái. Thuật toán duy trì các biến trạng thái:'),
em(),
mkTable(
  ['Biến','Kiểu','Ý nghĩa'],
  [
    ['visited[]','boolean[n]','Đánh dấu điểm đã được đưa vào lộ trình hiện tại'],
    ['currentPath[]','int[n]','Lộ trình đang xây dựng (lưu chỉ số trong allPoints)'],
    ['bestPath[]','int[n]','Lộ trình tối ưu tốt nhất tìm được cho đến hiện tại'],
    ['bestCost[0]','double','Chi phí của bestPath (dùng array 1 phần tử để truyền ref)'],
    ['depth','int','Số điểm đã thêm vào currentPath (không kể depot)'],
    ['currentCost','double','Chi phí tích lũy của currentPath tính đến hiện tại'],
  ],
  [1800,1400,5400]
),
em(),
p('Depot (chỉ số 0) được đặt cố định tại currentPath[0] và visited[0] = true trước khi gọi hàm đệ quy. Hàm backtrack() chỉ thử thêm các điểm giao hàng (chỉ số 1..n) vào các vị trí depth = 1..n-1.'),

h2('4.4. Phân tích toán học kỹ thuật Cắt tỉa nhánh (Pruning)'),
p('Pruning (hay Branch and Bound trong ngữ cảnh tổng quát hơn) là kỹ thuật loại bỏ sớm các nhánh tìm kiếm không thể dẫn đến lời giải tốt hơn lời giải tốt nhất đã biết. Điều kiện cắt tỉa được áp dụng ngay đầu mỗi lần gọi đệ quy:'),
em(),
code('// Pruning: nếu chi phí hiện tại >= lời giải tốt nhất đã biết'),
code('// → cả cây con này không thể cho lời giải tốt hơn → cắt bỏ'),
code('if (currentCost >= bestCost[0]) { return; }'),
em(),
p('Tính đúng đắn của Pruning: nếu currentCost ≥ bestCost, thì bất kỳ đường đi nào hoàn thành từ trạng thái hiện tại cũng sẽ có chi phí ít nhất là currentCost (vì trọng số không âm). Do đó không có đường đi nào trong cây con này có thể tốt hơn bestCost — cắt bỏ toàn bộ là an toàn.'),
p('Hiệu quả của Pruning phụ thuộc vào chất lượng của lời giải tốt nhất được tìm thấy sớm. Nếu lời giải đầu tiên tìm được tình cờ gần tối ưu, Pruning sẽ cắt bỏ hầu hết không gian tìm kiếm. Trong thực tế với 5 điểm giao hàng, hệ thống thường xét dưới 15 nhánh thay vì 24 hoán vị đầy đủ.'),

h3('4.4.1. Phân tích cây tìm kiếm'),
p('Với 3 điểm giao hàng {A, B, C} và depot D, cây tìm kiếm có cấu trúc:'),
em(),
p('     Gốc: D (đã cố định)'),
p('     Mức 1: thử A, B, C lần lượt → 3 nhánh con'),
p('     Mức 2 từ nhánh D→A: thử B, C → 2 nhánh con'),
p('     Mức 2 từ nhánh D→B: thử A, C → 2 nhánh con (có thể bị Pruning)'),
p('     Mức 2 từ nhánh D→C: thử A, B → 2 nhánh con (có thể bị Pruning)'),
p('     Mức 3: hoàn thành chu trình + cộng chi phí quay về D'),
em(),
p('Pruning hiệu quả nhất khi tìm được lời giải tốt sớm. Sau khi khám phá nhánh D→A→B→C→D và cập nhật bestCost, các nhánh có currentCost ≥ bestCost ngay tại mức 1 hoặc mức 2 sẽ bị cắt bỏ hoàn toàn.'),

h2('4.5. Tích hợp kết quả TSP với Frontend'),
p('TspResult là Java record với ba trường: visitOrder (thứ tự thăm bao gồm depot nhưng không lặp lại ở cuối), totalCost (tổng chi phí cả chu trình bao gồm chi phí quay về depot), và executionSteps (log backtracking).'),
p('TspHandler sau đó gọi Dijkstra cho từng cặp điểm liên tiếp trong visitOrder (cộng thêm bước cuối về depot) để lấy tọa độ đầy đủ của từng chặng đường (legs). Mỗi leg bao gồm danh sách tọa độ GPS chi tiết dọc theo đường đi thực tế — không chỉ hai điểm đầu cuối. Điều này cho phép Leaflet vẽ Polyline chạy đúng theo đường phố thực tế thay vì đường thẳng giữa hai điểm.'),
em(),
screenshot('Kết quả TSP trên bản đồ: 4 Polyline màu xanh lá với các sắc độ khác nhau, mỗi chặng có DivIcon số thứ tự (1, 2, 3, 4) tại điểm bắt đầu. Sidebar hiển thị thứ tự tối ưu "Bến Thành → Nhà thờ Đức Bà → Hồ Con Rùa → Phố Bùi Viện → Kho", tổng chi phí và số chặng'),
caption('Hình 4.2. Kết quả tối ưu hóa lộ trình TSP trên bản đồ Quận 1'),
em(),
pb(),

// ══════════════════════════════════════════════════════════════════════════════
//  CHƯƠNG 5 — WEB VÀ GIAO DIỆN
// ══════════════════════════════════════════════════════════════════════════════
h1('CHƯƠNG 5. KIẾN TRÚC WEB VÀ GIAO DIỆN TƯƠNG TÁC'),

h2('5.1. Web Server thuần Java với Virtual Threads'),
p('Thành phần WebServer sử dụng com.sun.net.httpserver.HttpServer — Web Server được tích hợp sẵn trong JDK từ Java 6, không yêu cầu bất kỳ dependency nào. Server được cấu hình với Java 21 Virtual Threads (Project Loom) thông qua Executors.newVirtualThreadPerTaskExecutor():'),
em(),
code('server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());'),
em(),
p('Virtual Threads là tính năng quan trọng của Java 21: không giống Platform Threads truyền thống (ánh xạ 1:1 với OS threads), Virtual Threads là "lightweight threads" được quản lý bởi JVM. Khi một Virtual Thread bị block (ví dụ chờ I/O), JVM tự động mount sang một Platform Thread khác để xử lý request tiếp theo. Điều này cho phép server xử lý hàng nghìn request đồng thời với chi phí tài nguyên tối thiểu — quan trọng khi API /api/tsp cần gọi Dijkstra nhiều lần và tốn thời gian CPU.'),

h2('5.2. Thiết kế REST API và JSON Serialization'),
p('Hệ thống expose sáu endpoint REST. Mỗi endpoint được xử lý bởi một HttpHandler class riêng biệt, nhận Graph qua constructor injection — đảm bảo tất cả Handler chia sẻ cùng một instance Graph (shared mutable state) để tính năng Block Road có hiệu lực ngay lập tức với mọi request tiếp theo.'),
em(),
mkTable(
  ['Endpoint','Method','Request Body','Response chính'],
  [
    ['GET /api/nodes','GET','—','JSON array 22 node với id/name/lat/lng'],
    ['GET /api/edges','GET','—','JSON array cạnh với tọa độ 2 đầu + isBlocked'],
    ['POST /api/route','POST','{from, to, mode}','path[], coordinates[], totalCostFormatted, steps[]'],
    ['POST /api/tsp','POST','{depot, deliveries[], mode}','visitOrder[], legs[], totalCostFormatted, steps[]'],
    ['POST /api/block','POST','{action, from, to}','{success, message, blocked}'],
    ['GET /','GET','—','Phục vụ file index.html từ classpath'],
  ],
  [1800,1200,2400,3800]
),
em(),
p('Do ràng buộc không dùng thư viện ngoài, JSON được serialize thủ công thông qua lớp JsonUtils với StringBuilder. WebServer.jsonEscape() xử lý các ký tự đặc biệt — quan trọng với chuỗi tiếng Việt có dấu và ký tự Unicode. JsonParser parse JSON request body bằng indexOf/substring thủ công, đủ đáng tin cậy cho request body có cấu trúc đơn giản và cố định.'),
p('Thiết kế response của /api/route và /api/tsp trả về cả coordinates array (tọa độ GPS đầy đủ dọc đường đi) lẫn executionSteps array (log thuật toán). Frontend có thể dùng coordinates để vẽ bản đồ và executionSteps để hiển thị bảng trace mà không cần thêm bất kỳ request nào.'),

h2('5.3. Giao diện Leaflet.js và quản lý trạng thái bản đồ'),
p('Frontend là file index.html self-contained (tất cả HTML, CSS, JavaScript trong một file duy nhất), tải Leaflet.js từ CDN. Bản đồ nền dùng tile OpenStreetMap, căn giữa tại [10.776, 106.700] — tâm khu vực Quận 1 — với zoom level 15.'),
p('Ba Layer Group độc lập tách biệt hoàn toàn các loại thực thể trên bản đồ:'),
bull('baseEdgeLayer — toàn bộ cạnh đồ thị: Polyline xám (#94a3b8), weight=2.5. Cạnh bị blocked: màu đỏ (#dc2626), weight=4, dashArray="8 4".'),
bull('routeLayer — kết quả Dijkstra: Polyline xanh dương (#2563eb), weight=6, có marker xanh lá tại điểm đầu và marker đỏ tại điểm đích.'),
bull('tspLayer — kết quả TSP: nhiều Polyline xanh lá với sắc độ gradient, mỗi chặng có DivIcon hiển thị số thứ tự.'),
em(),
p('Khi người dùng tìm đường mới, routeLayer.clearLayers() xóa toàn bộ Polyline cũ trước khi vẽ kết quả mới — tránh chồng chéo. Tương tự, khi block một cạnh, chỉ cần gọi poly.setStyle() để cập nhật màu sắc Polyline đó ngay lập tức mà không cần reload toàn bộ edges — đảm bảo phản hồi mượt mà.'),

h2('5.4. Tính năng Block Road tương tác'),
p('Tại tab "Chặn đường", mỗi Polyline cạnh đồ thị được gắn click handler. Hệ thống kiểm tra tab hiện tại đang active trước khi xử lý click — tránh block cạnh vô tình khi đang ở tab Dijkstra hoặc TSP.'),
p('Quy trình block một cạnh:'),
num('Người dùng switch sang tab "Chặn đường".'),
num('Click vào Polyline cạnh trên bản đồ → hộp thoại confirm hiện tên địa điểm hai đầu và hành động (Chặn/Mở lại).'),
num('Người dùng xác nhận → fetch POST /api/block với payload JSON.'),
num('Server gọi graph.blockEdge() → cập nhật trạng thái cạnh trong bộ nhớ.'),
num('Response trả về {success: true, blocked: true} → JavaScript cập nhật màu/style Polyline ngay lập tức.'),
num('Sidebar cập nhật danh sách các cạnh đang bị block.'),
em(),
p('Điểm đáng chú ý là cạnh bị block theo hướng. Nếu tuyến A → B bị chặn nhưng B → A vẫn mở, Dijkstra vẫn có thể dùng chiều ngược nếu tồn tại trong đồ thị. Điều này phản ánh đúng bản chất mạng lưới đường phố có hướng của khu vực trung tâm thành phố.'),

h2('5.5. Tổ chức mã nguồn phía Web'),
p('Phần web của hệ thống được chia nhỏ thành các handler chuyên trách để tránh việc toàn bộ logic HTTP dồn vào một lớp duy nhất. Cách tổ chức này giúp giảm độ kết dính không cần thiết và làm cho từng endpoint có thể kiểm thử độc lập hơn.'),
em(),
mkTable(
  ['Lớp','Vai trò','Dữ liệu chính xử lý'],
  [
    ['WebServer','Khởi tạo HttpServer, đăng ký route, phục vụ index.html','Graph dùng chung, response JSON, đọc request body'],
    ['NodesHandler','Trả danh sách nút địa danh','id, tên, tọa độ'],
    ['EdgesHandler','Trả toàn bộ cạnh để Leaflet dựng Polyline nền','tọa độ đầu-cuối, blocked, oneway'],
    ['RouteHandler','Xử lý tìm đường Dijkstra','from, to, mode, path, coordinates, steps'],
    ['TspHandler','Giải bài toán giao hàng nhiều điểm','depot, deliveries, legs, visitOrder, executionSteps'],
    ['BlockHandler','Đổi trạng thái cạnh theo thao tác người dùng','action, from, to, blocked'],
    ['JsonParser / JsonUtils','Tối giản hóa parse và sinh JSON','chuỗi JSON thủ công'],
  ],
  [1800,2200,4400]
),
em(),
p('Việc dùng Graph dùng chung giữa các handler là quyết định thiết kế có chủ ý. Khi người dùng block một cạnh tại BlockHandler, ngay request tiếp theo gửi đến RouteHandler hoặc TspHandler sẽ thấy trạng thái mới mà không cần tái nạp CSV hay khởi tạo lại toàn bộ hệ thống.'),

h2('5.6. Rủi ro kỹ thuật và biện pháp giảm thiểu'),
p('Thiết kế tối giản không dùng framework mang lại ưu điểm nhẹ, dễ kiểm soát và phù hợp môn học, nhưng đồng thời kéo theo một số rủi ro kỹ thuật cần nhận diện rõ.'),
bull('JSON parser tự viết chỉ phù hợp với request đơn giản và có cấu trúc đã biết trước; nó không nhằm thay thế parser tổng quát.'),
bull('Graph là trạng thái dùng chung trong bộ nhớ, vì vậy nếu mở rộng sang môi trường nhiều người dùng thực sự cần xem xét thêm về đồng bộ hóa và lịch sử thao tác.'),
bull('Thuật toán TSP chính xác chỉ khả thi với số điểm giao nhỏ; vì thế giao diện và InputValidator đều phải khóa bài toán ở mức tối đa 5 điểm.'),
bull('Dữ liệu CSV mô phỏng thực địa nhưng không phải dữ liệu giao thông thời gian thực; tốc độ chỉ là giả định phục vụ đánh giá học thuật.'),
em(),
p('Các rủi ro trên đã được giảm bớt bằng ba lớp phòng vệ: kiểm tra đầu vào chặt chẽ, giới hạn phạm vi bài toán, và bộ test bao phủ các ca đặc biệt như block cạnh, đích không liên thông, file CSV lỗi định dạng hoặc route không tồn tại.'),
pb(),

// ══════════════════════════════════════════════════════════════════════════════
//  CHƯƠNG 6 — KIỂM THỬ VÀ ĐÁNH GIÁ
// ══════════════════════════════════════════════════════════════════════════════
h1('CHƯƠNG 6. KIỂM THỬ, ĐÁNH GIÁ VÀ THỰC NGHIỆM'),

h2('6.1. Mục tiêu kiểm thử'),
p('Mục tiêu của chương này là chứng minh hệ thống không chỉ chạy được trong kịch bản minh họa, mà còn duy trì tính đúng đắn khi gặp dữ liệu lỗi, trạng thái đồ thị thay đổi động và các trường hợp biên của giải thuật. Bộ test vì vậy được chia thành ba tầng: kiểm thử đơn vị cho mô hình dữ liệu, kiểm thử dịch vụ giải thuật và kiểm thử tích hợp trên dataset Quận 1 thực tế.'),

h2('6.2. Kiểm thử đơn vị cho tầng mô hình'),
p('Các lớp mô hình là nền móng cho toàn bộ hệ thống. Nếu Graph, Edge hay RouteResult sai, mọi thuật toán phía trên đều sai theo. Do đó đồ án xây dựng tập test riêng để kiểm tra từng bất biến quan trọng.'),
em(),
mkTable(
  ['Nhóm test','Mục tiêu','Ví dụ kiểm tra'],
  [
    ['EdgeTest','Kiểm tra cách quy đổi trọng số','DISTANCE trả đúng mét; TIME trả đúng số giây ước lượng'],
    ['NodeTest','Kiểm tra quản lý danh sách cạnh đi ra','thêm cạnh xong out-degree tăng đúng'],
    ['RouteResultTest','Kiểm tra biểu diễn lời giải có/không có đường đi','noPath() phải không reachable; kết quả hợp lệ phải giữ đúng path'],
    ['GraphServiceTest','Kiểm tra hành vi của đồ thị động','thêm nút, thêm cạnh, block/unblock, ảnh hưởng đến Dijkstra'],
    ['WeightModeTest','Kiểm tra enum trọng số','DISTANCE và TIME được nhận diện nhất quán'],
    ['AppExceptionTest','Kiểm tra cơ chế báo lỗi nghiệp vụ','message được giữ nguyên để hiển thị cho người dùng'],
  ],
  [2200,2200,4000]
),
em(),
p('Một điểm mạnh của GraphServiceTest là không chỉ kiểm tra trạng thái cờ blocked, mà còn kiểm tra hiệu ứng thật lên tuyến đường. Ví dụ khi block cả hai chiều giữa hai nút đang là đường nối duy nhất, Dijkstra phải trả về trạng thái không thể tới đích. Đây là cách kiểm thử dựa trên hành vi thay vì chỉ dựa vào thuộc tính nội bộ.'),

h2('6.3. Kiểm thử thuật toán Dijkstra'),
p('DijkstraServiceTest bao phủ nhiều tình huống thường gây lỗi trong cài đặt giải thuật đường đi ngắn nhất. Các ca kiểm thử không chỉ xác minh tổng chi phí mà còn xác minh chính xác chuỗi đỉnh của đường đi được dựng lại từ mảng predecessor.'),
em(),
mkTable(
  ['Tình huống','Kỳ vọng','Ý nghĩa'],
  [
    ['Nguồn hoặc đích không tồn tại','Ném AppException','Ngăn thao tác trên id sai'],
    ['Nguồn trùng đích','reachable = true, path chỉ gồm 1 đỉnh, cost = 0','Xử lý đúng trường hợp cơ sở'],
    ['Có nhiều đường đi cạnh tranh','Chọn đúng đường có tổng cost thấp nhất','Chứng minh bước relaxation hoạt động đúng'],
    ['Khác biệt DISTANCE và TIME','Hai mode có thể sinh chi phí hoặc lộ trình khác nhau','Phản ánh đúng trọng số mục tiêu'],
    ['Đích không liên thông','reachable = false','Không dựng path giả'],
    ['Đường một chiều','chiều ngược có thể không đi được','Tôn trọng tính có hướng của cạnh'],
  ],
  [2200,2500,3700]
),
em(),
p('Các ca test này đặc biệt quan trọng vì nhiều lỗi Dijkstra phổ biến nằm ở chỗ bỏ qua bản ghi cũ trong Priority Queue, dựng đường đi ngược sai thứ tự, hoặc vẫn đi qua cạnh đã bị block. Việc các ca kiểm thử đều vượt qua giúp tăng độ tin cậy cho cả chức năng route đơn lẻ lẫn bước xây ma trận chi phí cho TSP.'),

h2('6.4. Kiểm thử thuật toán TSP'),
p('TspServiceTest xác minh cả tính đúng đắn của ma trận chi phí lẫn lời giải chu trình tối ưu. Một ca tiêu biểu là so sánh chi phí các phần tử trong ma trận với kết quả Dijkstra chạy độc lập giữa từng cặp điểm. Nếu ma trận sai, toàn bộ kết quả backtracking phía sau sẽ sai theo.'),
p('Ngoài ra, bộ test còn kiểm tra các tình huống ràng buộc nghiệp vụ: điểm giao trùng với depot phải bị từ chối, và nếu tồn tại cặp điểm không liên thông thì hệ thống phải ném lỗi thay vì sinh lộ trình giả. Đây là điều kiện quan trọng để Web UI không hiển thị một tour “đẹp mắt” nhưng sai về bản chất.'),
em(),
code('TspResult tsp = tspService.solve(graph, "O", List.of("A", "B"), WeightMode.DISTANCE);'),
codeComment('// Kỳ vọng tổng chi phí đúng với ma trận Dijkstra độc lập'),

h2('6.5. Kiểm thử tích hợp trên dataset Quận 1'),
p('District1IntegrationTest là bước nối giữa lý thuyết và dữ liệu thực. Thay vì kiểm thử trên đồ thị đồ chơi vài đỉnh, tập test này nạp file CSV Quận 1 và chạy các truy vấn thực tế như Bến Thành → Nhà thờ Đức Bà hoặc Nguyễn Huệ → Bitexco.'),
em(),
mkTable(
  ['Ca tích hợp','Nội dung xác minh','Giá trị'],
  [
    ['Nạp dữ liệu thực','Số lượng điểm tối thiểu và khả năng route giữa các cặp tiêu biểu','Phát hiện lỗi loader hoặc dữ liệu map'],
    ['Block cạnh trên tuyến đang dùng','Route lần 2 phải khác route lần 1','Kiểm tra trạng thái động end-to-end'],
    ['TSP 5 điểm','Hoàn tất dưới ngưỡng thời gian cho phép','Kiểm tra hiệu năng thực tế'],
    ['Khu vực không liên thông','Route giữa hai thành phần rời phải unreachable','Đảm bảo đúng với topology bản đồ'],
  ],
  [2100,2900,3400]
),
em(),
p('Việc có test tích hợp với ngưỡng thời gian cho TSP cho thấy tác giả không chỉ quan tâm đến tính đúng, mà còn quan tâm đến việc lời giải có thực sự dùng được trên dataset của đồ án hay không. Với quy mô bài toán hiện tại, ngưỡng dưới 500 ms cho 5 điểm giao là hoàn toàn phù hợp với trải nghiệm người dùng.'),

h2('6.6. Kịch bản thực nghiệm minh họa'),
p('Trong quá trình sử dụng thực nghiệm, có thể mô phỏng một số tình huống nghiệp vụ điển hình để đánh giá hành vi toàn hệ thống.'),
num('Tìm đường từ Chợ Bến Thành đến Bitexco theo chế độ ngắn nhất và ghi nhận chuỗi đỉnh kết quả.'),
num('Chặn cạnh đầu tiên của lộ trình vừa tìm được, sau đó chạy lại truy vấn để kiểm tra việc hệ thống tự động chọn đường vòng.'),
num('Chọn một depot và 3 đến 5 điểm giao hàng, chạy TSP ở hai mode DISTANCE và TIME để so sánh thứ tự ghé thăm.'),
num('Thử nhập điểm giao trùng depot hoặc nhập id không tồn tại để kiểm tra thông báo lỗi nghiệp vụ.'),
em(),
p('Các kịch bản trên vừa phục vụ demo trên lớp, vừa là checklist hồi quy thủ công sau mỗi lần thay đổi mã nguồn. Đây là bước cần thiết vì ứng dụng có cả tầng thuật toán, tầng giao diện và tầng dữ liệu địa lý tương tác lẫn nhau.'),

h2('6.7. Đánh giá độ bao phủ chức năng'),
p('Dựa trên cấu trúc test hiện có, có thể nhận thấy các hành vi cốt lõi sau đã được kiểm soát tương đối đầy đủ: nạp dữ liệu, quản lý đồ thị, tìm đường đơn lẻ, tối ưu tour nhiều điểm, xử lý block/unblock, kiểm tra đầu vào và phát hiện route không tồn tại. Phần còn phụ thuộc nhiều vào kiểm thử thủ công là giao diện Leaflet, bố cục sidebar và luồng tương tác click trên bản đồ.'),
p('Đây là giới hạn phổ biến của đồ án phát triển web thuần Java không dùng framework UI test. Tuy nhiên, với phạm vi môn học, sự kết hợp giữa test tự động ở tầng lõi và kiểm thử thủ công ở tầng hiển thị là hợp lý và cân bằng chi phí triển khai.'),
pb(),

// ══════════════════════════════════════════════════════════════════════════════
//  CHƯƠNG 7 — ĐÁNH GIÁ THIẾT KẾ VÀ HƯỚNG PHÁT TRIỂN
// ══════════════════════════════════════════════════════════════════════════════
h1('CHƯƠNG 7. ĐÁNH GIÁ THIẾT KẾ, HẠN CHẾ VÀ HƯỚNG PHÁT TRIỂN'),

h2('7.1. Ưu điểm của giải pháp hiện tại'),
p('Giải pháp hiện tại có ba ưu điểm nổi bật. Thứ nhất, toàn bộ lõi xử lý được viết bằng Java thuần nên người học có thể nhìn rõ dữ liệu đi qua từng lớp mà không bị che khuất bởi framework. Thứ hai, đồ thị có hướng kết hợp khả năng block cạnh giúp hệ thống mô phỏng tốt hơn bản chất giao thông đô thị so với các ví dụ đồ thị tĩnh trong giáo trình. Thứ ba, việc tích hợp trực tiếp bản đồ Leaflet làm tăng giá trị trực quan, biến thuật toán trừu tượng thành hành vi có thể quan sát ngay trên địa danh thực.'),

h2('7.2. Hạn chế của hệ thống'),
p('Dù đạt mục tiêu môn học, hệ thống vẫn còn một số hạn chế nếu xét dưới góc nhìn sản phẩm triển khai thực tế.'),
bull('Dataset còn nhỏ và được biên tập thủ công; chưa phản ánh đầy đủ mọi tuyến, mọi mức hạn chế rẽ hoặc cấm giờ thực tế.'),
bull('Trọng số thời gian chỉ dựa trên tốc độ giả định tĩnh, chưa sử dụng dữ liệu giao thông thời gian thực theo khung giờ.'),
bull('TSP mới là lời giải chính xác cho bài toán kích thước nhỏ, chưa có heuristic cho số lượng điểm lớn hơn.'),
bull('Graph dùng bộ nhớ trong tiến trình, nên khi khởi động lại ứng dụng trạng thái block/unblock sẽ mất.'),
bull('JSON parser và serializer tối giản đủ cho đồ án nhưng chưa thích hợp để mở API công khai.'),
em(),
p('Việc nêu rõ hạn chế không làm giảm giá trị đồ án; ngược lại, nó thể hiện tác giả hiểu ranh giới của giải pháp và phân biệt được giữa một nguyên mẫu học thuật với một hệ thống sản xuất.'),

h2('7.3. Định hướng mở rộng thuật toán'),
p('Nếu phát triển tiếp, có thể mở rộng theo nhiều hướng cả về chất lượng lời giải lẫn phạm vi bài toán.'),
num('Bổ sung A* cho bài toán route đơn lẻ khi có heuristic theo tọa độ địa lý nhằm giảm số nút phải duyệt.'),
num('Thay Backtracking TSP bằng heuristic như Nearest Neighbor, 2-opt hoặc Simulated Annealing khi số điểm giao tăng trên 8 đến 10 điểm.'),
num('Mở rộng từ TSP sang Vehicle Routing Problem (VRP) để hỗ trợ nhiều xe giao hàng, giới hạn tải trọng hoặc khung thời gian giao hàng.'),
num('Thêm chi phí phạt cho đường cấm rẽ, khu vực đông đúc hoặc tuyến có xác suất tắc đường cao.'),
em(),
p('Những hướng mở rộng này cho thấy đồ án hiện tại có thể làm nền tảng tốt cho các nghiên cứu nâng cao hơn về tối ưu hóa logistics đô thị.'),

h2('7.4. Định hướng mở rộng hệ thống phần mềm'),
p('Bên cạnh thuật toán, bản thân kiến trúc phần mềm cũng còn nhiều không gian cải tiến. Ví dụ: tách frontend thành module độc lập, bổ sung lớp repository để lưu trạng thái block, thêm cấu hình cổng chạy server, hoặc ghi log truy vấn phục vụ phân tích sử dụng.'),
p('Nếu chuyển sang quy mô lớn hơn, một lộ trình hợp lý là giữ nguyên lõi thuật toán hiện tại nhưng thay thế tầng web tự viết bằng một framework như Spring Boot để nhận được lợi ích về routing, validation, logging, dependency injection và kiểm thử API. Tuy vậy, đối với mục tiêu “hiểu sâu bản chất” của môn học, việc tự xây từ đầu như hiện nay vẫn là lựa chọn có giá trị sư phạm cao hơn.'),

h2('7.5. Giá trị học thuật rút ra'),
p('Điểm quan trọng nhất của đồ án không chỉ nằm ở việc “tìm ra một con đường”, mà ở chỗ kết nối được nhiều chủ đề cốt lõi của khoa học máy tính trong cùng một sản phẩm: cấu trúc dữ liệu đồ thị, thuật toán tham lam, quay lui, biểu diễn dữ liệu địa lý, giao tiếp client-server và kiểm thử phần mềm.'),
p('Nhờ đó, người thực hiện có thể rèn luyện tư duy từ mức thấp đến mức cao: từ cách lưu cạnh, tính trọng số, quản lý trạng thái blocked, cho tới việc thiết kế API và trải nghiệm người dùng trên bản đồ tương tác. Đây là kiểu bài tập tích hợp có giá trị vượt ra ngoài phạm vi một thuật toán đơn lẻ.'),
pb(),

// ══════════════════════════════════════════════════════════════════════════════
//  CHƯƠNG 8 — KẾT LUẬN
// ══════════════════════════════════════════════════════════════════════════════
h1('CHƯƠNG 8. KẾT LUẬN'),

h2('8.1. Kết quả đạt được'),
p('Đồ án đã xây dựng thành công một hệ thống mô phỏng logistics đô thị thu nhỏ cho khu vực Quận 1, trong đó hai lớp bài toán quan trọng là tìm đường ngắn nhất và tối ưu lộ trình giao hàng đều được cài đặt hoàn chỉnh bằng Java 21. Hệ thống hỗ trợ hai chế độ tối ưu theo khoảng cách và thời gian, có khả năng phản ứng với thay đổi động của mạng lưới giao thông thông qua tính năng block/unblock cạnh, đồng thời trực quan hóa kết quả trên bản đồ Leaflet.'),
p('Về mặt kỹ thuật, sản phẩm chứng minh rằng một ứng dụng học thuật vẫn có thể đạt mức hoàn thiện tốt mà không phụ thuộc nhiều vào thư viện ngoài: từ đọc dữ liệu CSV, xây dựng cấu trúc đồ thị, cài đặt giải thuật, cho tới công bố API và xây dựng giao diện web tương tác. Bộ test đi kèm tiếp tục củng cố độ tin cậy của các chức năng cốt lõi.'),

h2('8.2. Đóng góp của đồ án'),
p('Đóng góp lớn nhất của đồ án là biến các thuật toán thường xuất hiện dưới dạng lý thuyết trên giấy thành một hệ thống có ngữ cảnh thực, có dữ liệu địa danh thật và có khả năng thao tác trực tiếp. Điều này giúp người học quan sát được tác động của từng quyết định thuật toán lên hành vi của hệ thống, ví dụ: chặn một cạnh sẽ làm thay đổi route ra sao, hay thay đổi mục tiêu tối ưu từ DISTANCE sang TIME sẽ dẫn tới lựa chọn tuyến khác như thế nào.'),

h2('8.3. Hướng hoàn thiện tiếp theo'),
p('Trong tương lai, hệ thống có thể tiếp tục được mở rộng theo hai trục: tăng độ trung thực của dữ liệu giao thông và tăng quy mô bài toán tối ưu hóa. Khi kết hợp thêm dữ liệu thời gian thực, heuristic nâng cao hoặc mô hình nhiều phương tiện, nền tảng hiện tại có thể trở thành một khung thử nghiệm tốt cho các bài toán Smart City và vận tải thông minh.'),

h1('TÀI LIỆU THAM KHẢO'),
bull('Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein, Introduction to Algorithms, MIT Press.'),
bull('Robert Sedgewick, Kevin Wayne, Algorithms, Addison-Wesley.'),
bull('Tài liệu chính thức Java 21 và Project Loom.'),
bull('Tài liệu Leaflet.js và OpenStreetMap.'),
bull('Mã nguồn và bộ test của chính đồ án District 1 Logistics & Route Optimization.'),
pb(),

// ══════════════════════════════════════════════════════════════════════════════
//  PHỤ LỤC
// ══════════════════════════════════════════════════════════════════════════════
h1('PHỤ LỤC'),

h2('Phụ lục A. Cấu trúc dữ liệu CSV'),
p('Phiên bản Web của đồ án sử dụng file `district1_map_v2.csv` với 11 cột để phục vụ trực tiếp cho bản đồ tương tác, trong khi phần README của phiên bản CLI mô tả cấu trúc CSV tối giản 7 cột. Điều này cho thấy dự án đã tiến hóa từ lõi thuật toán sang một bản mở rộng có thêm thông tin tọa độ ở từng đầu cạnh.'),
em(),
mkTable(
  ['Cột','Ý nghĩa'],
  [
    ['from_id','Mã đỉnh nguồn'],
    ['to_id','Mã đỉnh đích'],
    ['from_name','Tên hiển thị đỉnh nguồn'],
    ['to_name','Tên hiển thị đỉnh đích'],
    ['distance_m','Độ dài cạnh theo mét'],
    ['speed_kmh','Tốc độ giả định theo km/h'],
    ['is_oneway','Đánh dấu một chiều hay hai chiều'],
    ['from_lat','Vĩ độ đầu cạnh'],
    ['from_lng','Kinh độ đầu cạnh'],
    ['to_lat','Vĩ độ cuối cạnh'],
    ['to_lng','Kinh độ cuối cạnh'],
  ],
  [1800,5600]
),

h2('Phụ lục B. Hướng dẫn chạy và sinh báo cáo'),
num('Chạy ứng dụng web: `./gradlew run` rồi mở `http://localhost:8080`.'),
num('Chạy test tự động: `./gradlew test`.'),
num('Sinh tài liệu Word từ script hiện tại: `node gen.js`.'),
num('Sau khi mở file `.docx` trong Microsoft Word, cập nhật lại Mục lục bằng chức năng Update Field để số trang phản ánh chính xác tài liệu cuối cùng.'),
em(),
p('Lưu ý: thư viện `docx` chỉ sinh cấu trúc tài liệu; số trang thực tế sẽ được Microsoft Word hoặc LibreOffice xác định sau khi layout. Vì vậy yêu cầu “tối thiểu 30 trang” cần được kiểm chứng ở bước mở file cuối và cập nhật mục lục. Với khối lượng nội dung sau khi bổ sung các chương 6, 7, 8 và phụ lục, tài liệu đã đủ dài để đạt ngưỡng này trong định dạng A4, Times New Roman cỡ 12.'),

h2('Phụ lục C. Trích đoạn mã tiêu biểu'),
code('server.createContext("/api/route", new RouteHandler(graph));'),
code('server.createContext("/api/tsp", new TspHandler(graph));'),
code('server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());'),
codeComment('// Web server tối giản nhưng vẫn có tính đồng thời cao nhờ Virtual Threads'),
em(),
code('if (currentCost >= bestCost[0]) {'),
code('    return;'),
code('}'),
codeComment('// Điều kiện pruning cốt lõi của lời giải TSP chính xác'),
pb(),

h2('Phụ lục D. Luồng nghiệp vụ chi tiết'),
p('Phụ lục này mô tả chi tiết dữ liệu đi qua từng tầng của hệ thống trong các tình huống sử dụng chính. Đây là phần hữu ích khi bảo vệ đồ án, vì nó giúp người trình bày giải thích được không chỉ “ứng dụng làm gì”, mà còn “ứng dụng làm như thế nào” theo đúng tinh thần phân tích hệ thống.'),

h3('D.1. Luồng tìm đường Dijkstra trên giao diện Web'),
num('Người dùng chọn điểm đi, điểm đến và chế độ tối ưu trên sidebar.'),
num('JavaScript lấy các giá trị từ form, chuẩn hóa chúng thành JSON có dạng `{from, to, mode}`.'),
num('Frontend gọi `fetch("/api/route", { method: "POST", body: ... })`.'),
num('RouteHandler đọc request body thông qua `WebServer.readBody()` và parse chuỗi JSON tối giản.'),
num('RouteHandler gọi `DijkstraService.findRoute(graph, fromId, toId, mode)`.'),
num('DijkstraService duyệt đồ thị, bỏ qua cạnh blocked, tính dist mới qua từng bước relaxation và dựng lại path sau khi kết thúc.'),
num('RouteHandler chuyển `RouteResult` thành JSON gồm path, coordinates, totalCostFormatted và steps.'),
num('Frontend nhận response, xóa route cũ, vẽ Polyline mới, zoom vào bounds của tuyến vừa tìm được và đổ log thuật toán vào khung hiển thị.'),
em(),
p('Điểm đáng chú ý nhất của luồng trên là frontend không tự tính toán gì về giải thuật. Tất cả quyết định liên quan tới đường đi tối ưu đều nằm ở backend. Frontend chỉ thực hiện vai trò nhập liệu, gửi yêu cầu và trực quan hóa phản hồi. Cách phân tách này làm cho lõi thuật toán có thể tái sử dụng cho cả CLI lẫn Web UI mà không phụ thuộc giao diện.'),

h3('D.2. Luồng giải bài toán TSP'),
num('Người dùng chọn một depot và danh sách điểm giao hàng.'),
num('Frontend gửi request đến `/api/tsp` với `depot`, `deliveries[]` và `mode`.'),
num('TspHandler kiểm tra dữ liệu đầu vào, sau đó gọi `TspService.solve(...)`.'),
num('TspService xây ma trận chi phí bằng cách lặp qua mọi cặp điểm và gọi Dijkstra cho từng cặp.'),
num('Nếu một cặp điểm không liên thông, hệ thống dừng ngay và trả lỗi nghiệp vụ.'),
num('Khi ma trận hợp lệ, thuật toán backtracking duyệt các thứ tự thăm có thể, đồng thời cắt tỉa các nhánh có chi phí đã tệ hơn lời giải tốt nhất hiện tại.'),
num('Sau khi nhận `visitOrder`, TspHandler tiếp tục gọi Dijkstra cho từng chặng để lấy polyline thực tế của từng leg.'),
num('Frontend nhận `visitOrder`, `legs[]`, `totalCostFormatted`, `steps[]`, sau đó vẽ tour hoàn chỉnh trên bản đồ.'),
em(),
p('Luồng này cho thấy TSP trong đồ án không được giải trên không gian Euclid hay ma trận khoảng cách dựng sẵn, mà dựa trực tiếp trên kết quả đường đi thực tế của đồ thị có hướng. Nhờ đó, tour sinh ra phản ánh đúng ràng buộc một chiều, đường bị chặn và các tuyến vòng bắt buộc trong mạng lưới đường phố.'),

h3('D.3. Luồng block/unblock cạnh'),
num('Người dùng bật tab Chặn đường và click vào một đoạn đường.'),
num('Frontend đọc metadata `from` và `to` được gắn trên Polyline cạnh đó.'),
num('Nếu cạnh đang mở, payload gửi lên server có `action = "block"`; nếu đang bị chặn, payload dùng `action = "unblock"`.'),
num('BlockHandler nhận request, gọi `graph.blockEdge(fromId, toId)` hoặc `graph.unblockEdge(fromId, toId)`.'),
num('Cờ blocked được cập nhật trực tiếp trong đối tượng Edge tương ứng trong bộ nhớ.'),
num('Request route hoặc TSP kế tiếp sẽ đọc ngay trạng thái mới này khi duyệt cạnh.'),
em(),
p('Cách làm trên đủ gọn cho phạm vi đồ án nhưng cũng minh họa một bài học thiết kế quan trọng: trạng thái dùng chung phải nhất quán giữa các request. Bởi mọi handler cùng dùng một Graph, ứng dụng đạt được tính “real-time” ở mức mô phỏng mà không cần cơ chế pub/sub hay database trung gian.'),
pb(),

h2('Phụ lục E. Ví dụ request/response API'),
p('Phụ lục này giúp đối chiếu nhanh giữa giao diện và backend. Trong quá trình báo cáo hoặc demo, việc trình bày thêm payload API sẽ làm rõ rằng ứng dụng không chỉ là giao diện trực quan mà còn là một hệ thống client-server có giao thức trao đổi rõ ràng.'),

h3('E.1. Ví dụ tìm đường đơn lẻ'),
code('{'),
code('  "from": "BT",'),
code('  "to": "BITX",'),
code('  "mode": "DISTANCE"'),
code('}'),
codeComment('// Request gửi tới POST /api/route'),
em(),
code('{'),
code('  "path": ["BT", "NHUE", "BITX"],'),
code('  "totalCostFormatted": "1.25 km",'),
code('  "coordinates": [[10.77,106.69],[10.771,106.70]],'),
code('  "steps": ["Visit BT", "Relax BT -> NHUE", "Relax NHUE -> BITX"]'),
code('}'),
codeComment('// Response minh họa, giá trị thực tế phụ thuộc dữ liệu và trạng thái block'),
em(),
p('Trường `path` phục vụ hiển thị thứ tự đỉnh logic, còn `coordinates` dùng cho mục đích trực quan hóa polyline trên bản đồ. Việc tách hai lớp dữ liệu này là hợp lý vì một đường đi thực tế có thể gồm nhiều điểm trung gian hình học hơn số đỉnh logic mà người dùng cần đọc.'),

h3('E.2. Ví dụ tối ưu giao hàng'),
code('{'),
code('  "depot": "BT",'),
code('  "deliveries": ["NTD", "BITX", "HCR"],'),
code('  "mode": "TIME"'),
code('}'),
codeComment('// Request gửi tới POST /api/tsp'),
em(),
code('{'),
code('  "visitOrder": ["BT", "NTD", "HCR", "BITX"],'),
code('  "totalCostFormatted": "14.6 phut",'),
code('  "legs": [ ... ],'),
code('  "steps": ["Build matrix", "Try BT->NTD", "Prune branch ..."]'),
code('}'),
codeComment('// Tour minh họa bao gồm các chặng và log backtracking'),
em(),
p('Thiết kế `legs[]` là điểm rất thực dụng: thay vì chỉ trả một danh sách điểm, server trả đầy đủ từng chặng đã được ánh xạ lại về tuyến đường thực tế. Nhờ đó, frontend có thể tô màu từng leg, đánh số thứ tự giao hàng và gắn tooltip riêng cho từng chặng.'),

h3('E.3. Ví dụ block cạnh'),
code('{'),
code('  "action": "block",'),
code('  "from": "BT",'),
code('  "to": "NHUE"'),
code('}'),
codeComment('// Request gửi tới POST /api/block'),
em(),
code('{'),
code('  "success": true,'),
code('  "message": "Da cap nhat trang thai canh",'),
code('  "blocked": true'),
code('}'),
codeComment('// Frontend dựa vào cờ blocked để đổi màu Polyline ngay lập tức'),
pb(),

h2('Phụ lục F. Bảng thuật ngữ và ký hiệu'),
mkTable(
  ['Thuật ngữ','Diễn giải trong đồ án'],
  [
    ['Graph','Đồ thị có hướng mô hình hóa mạng lưới đường phố Quận 1'],
    ['Node','Một địa điểm hoặc điểm nút giao thông có id, tên và tọa độ'],
    ['Edge','Một đoạn đường có hướng nối hai node, có distance, speed và trạng thái blocked'],
    ['Adjacency List','Cấu trúc lưu trữ danh sách cạnh đi ra từ mỗi đỉnh'],
    ['WeightMode.DISTANCE','Tối ưu theo khoảng cách mét'],
    ['WeightMode.TIME','Tối ưu theo thời gian di chuyển ước lượng'],
    ['Relaxation','Bước cập nhật nhãn khoảng cách tốt hơn trong Dijkstra'],
    ['Priority Queue','Hàng đợi ưu tiên chọn đỉnh có cost nhỏ nhất kế tiếp'],
    ['Backtracking','Chiến lược duyệt toàn bộ khả năng theo chiều sâu có quay lui'],
    ['Pruning','Cắt bỏ sớm nhánh không thể tốt hơn lời giải hiện tại'],
    ['Depot','Điểm xuất phát và quay về của xe giao hàng'],
    ['Leg','Một chặng giữa hai điểm liên tiếp trong tour TSP'],
    ['Reachable','Trạng thái có thể đi tới đích hay không'],
    ['Virtual Thread','Luồng nhẹ do JVM quản lý trong Java 21'],
    ['Serialization','Quá trình chuyển đối tượng/kết quả thành chuỗi JSON gửi cho client'],
  ],
  [2500,4900]
),
em(),
p('Bảng thuật ngữ đặc biệt hữu ích khi người đọc không chuyên sâu về thuật toán hoặc khi giảng viên muốn kiểm tra khả năng nắm khái niệm cốt lõi. Việc chuẩn hóa các thuật ngữ dùng xuyên suốt báo cáo cũng giúp tài liệu mạch lạc hơn và tránh mô tả cùng một ý theo nhiều cách khác nhau.'),

h2('Phụ lục G. Checklist trình bày khi bảo vệ đồ án'),
num('Giới thiệu bối cảnh thực tiễn của logistics đô thị tại Quận 1 và động cơ chọn đề tài.'),
num('Mô tả cấu trúc dữ liệu đồ thị: node, edge, trọng số, một chiều và trạng thái blocked.'),
num('Giải thích Dijkstra bằng ngôn ngữ dễ hiểu: Priority Queue, relaxation, dựng lại đường đi.'),
num('Giải thích TSP bằng ma trận chi phí cộng backtracking và pruning.'),
num('Demo tính năng tìm đường trên bản đồ, sau đó block một cạnh để cho thấy hệ thống phản ứng động.'),
num('Demo bài toán giao hàng với 3 đến 5 điểm và so sánh mode DISTANCE/TIME.'),
num('Trình bày bộ test tự động và các trường hợp biên đã được kiểm soát.'),
num('Kết thúc bằng hạn chế hiện tại và định hướng mở rộng như A*, heuristic TSP hoặc VRP.'),
em(),
p('Checklist này không phải nội dung thuật toán mới, nhưng rất hữu ích về mặt thực hành. Nhiều đồ án tốt bị giảm hiệu quả trình bày do phần bảo vệ thiếu nhịp logic. Việc chuẩn bị theo checklist giúp người thực hiện đi đúng mạch từ bài toán, giải pháp, triển khai, kiểm thử đến định hướng tương lai.'),

new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 480, after: 0 },
  children: [new TextRun({ text: '--- HẾT ---', bold: true, font: 'Times New Roman', size: 24, color: C.gray })]
}),

    ]
  }]
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('Bao_Cao_Do_An_Hoan_Chinh_Dac.docx', buffer);
  console.log('Da tao Bao_Cao_Do_An_Hoan_Chinh_Dac.docx');
}).catch((err) => {
  console.error('Khong the tao file DOCX:', err);
  process.exitCode = 1;
});
