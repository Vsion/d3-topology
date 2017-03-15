# d3-topology
base on d3 2.10.3

-//节点属性集合
-var showDeatails = [
-  {
    name: "name",  //属性名称
    value: "value" //属性值
  },
  ...
];

//节点集合
var nodes=[
  {
    id: '1', //唯一标识
    imgUrl: './img/test.png', //显示图片路径
    name: 'M', //展示名称
    showDeatails: showDeatails//节点详细信息
  },
  ...
];


//连线集合 连线属性集合showDeatails 结构同节点属性集合
//两个节点之间不同运动方向的线, 应至少有两条
var links=[
  { source:'1', target:'2', showDeatails: showDeatails, linkWidth: 5},
  {
    source:'2', //源节点
    target:'1', //目标节点
    showDeatails: [{name: "方向", value: "上行"}], //线qtip属性展示
    className: "link_error", //线className 可以根据不同属性定义连线样式
    linkWidth: 5 //线宽
  },
  /** source, target为相反的两条线, 建议线宽设置为等值, 视觉上是位置重合在一条线 方向不同 */
  ...
];

//options
var opt = {
  dom: '.container',  //外容器 必须
  nodes: nodes,       //节点集合, 默认[]
  childNodes: [],     //子节点集合, 默认[]
  links: links,       //线集合, 默认[]
  childLinks: [],     //子节点与父节点线集合, 默认[]
  scale: 2,           //缩放倍数 推荐2, 默认为1不缩放
  isQtip: true        //节点是否鼠标移入显示qtip, 默认为false
}


//构造实例对象
var topology=new Topology(opt);

