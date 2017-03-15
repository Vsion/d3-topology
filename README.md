# d3-topology
base on d3 2.10.3

//节点属性集合\<br>
var showDeatails = [\<br>
  {\<br>
    name: "name",  //属性名称\<br>
    value: "value" //属性值\<br>
  },\<br>
  ...\<br>
];\<br>

//节点集合\<br>
var nodes=[\<br>
  {\<br>
    id: '1', //唯一标识\<br>
    imgUrl: './img/test.png', //显示图片路径\<br>
    name: 'M', //展示名称\<br>
    showDeatails: showDeatails//节点详细信息\<br>
  },\<br>
  ...\<br>
];\<br>


//连线集合 连线属性集合showDeatails 结构同节点属性集合\<br>
//两个节点之间不同运动方向的线, 应至少有两条\<br>
var links=[\<br>
  { source:'1', target:'2', showDeatails: showDeatails, linkWidth: 5},\<br>
  {\<br>
    source:'2', //源节点\<br>
    target:'1', //目标节点\<br>
    showDeatails: [{name: "方向", value: "上行"}], //线qtip属性展示\<br>
    className: "link_error", //线className 可以根据不同属性定义连线样式\<br>
    linkWidth: 5 //线宽\<br>
  },\<br>
  /** source, target为相反的两条线, 建议线宽设置为等值, 视觉上是位置重合在一条线 方向不同 */\<br>
  ...\<br>
];\<br>

//options\<br>
var opt = {\<br>
  dom: '.container',  //外容器 必须\<br>
  nodes: nodes,       //节点集合, 默认[]\<br>
  childNodes: [],     //子节点集合, 默认[]\<br>
  links: links,       //线集合, 默认[]\<br>
  childLinks: [],     //子节点与父节点线集合, 默认[]\<br>
  scale: 2,           //缩放倍数 推荐2, 默认为1不缩放\<br>
  isQtip: true        //节点是否鼠标移入显示qtip, 默认为false\<br>
}\<br>


//构造实例对象\<br>
var topology=new Topology(opt);\<br>

