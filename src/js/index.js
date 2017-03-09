function Topology(opt){
  var self=this;
  var content = '<div class="c_drag c_top"></div><div class="c_drag c_top_right"></div><div class="c_drag c_right"></div><div class="c_drag c_bottom_right"></div><div class="c_drag c_bottom"></div><div class="c_drag c_bottom_left"></div><div class="c_drag c_left"></div><div class="c_drag c_top_left"></div>'
    + '<div id="getMoreDiv"><span>查看详细</span></div><div class="topology"></div>';
  if(typeof(opt.dom)=='string'){
    var container = document.querySelector(opt.dom);
    container.innerHTML = content;
    self.container = container.querySelector(".topology");
  };
  var container = self.container,
    w=container.clientWidth,
    h=container.clientHeight;
  self.distance = 200;
  self.opt = opt;
  self.currNode = null;
  self.childNodesIds = [];
  opt.childNodes.forEach(function(cn){
    self.childNodesIds.push(cn.id);
  })
  self.force = d3.layout.force().gravity(.05).distance(self.distance).charge(-800).size([w, h]);
  self.nodes = self.force.nodes();
  self.links = self.force.links();
  self.clickFn=function(node){ opt.nodeClickFn.call(self, node) };
  self.vis = d3.select(container).append("svg:svg")
         .attr("width", w).attr("height", h).attr("pointer-events", "all");

  self.force.on("tick", function(x){
    self.vis.selectAll("g.node")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    self.vis.selectAll("line.link")
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });
  });
  self.setDefaultNodes();
  (function(_this, _opt){
    _this.addNodes(_opt.nodes);
    _this.addLinks(_opt.links);
    _this.update();
  })(self, opt);
}

Topology.prototype.setDefaultNodes = function(){
  var nodes = this.opt.nodes;
  var childNodes = this.opt.childNodes;
  var childLinks = this.opt.childLinks;
  var nodesIds = [];
  childLinks.forEach(function(l, i, ls){
    nodesIds.push(l.source);
  })
  nodes.forEach(function(n, i, ns){
    n.operOpt = ["details"];
    if(nodesIds.indexOf(n.id) > -1){
      n.operOpt.push("childNodes");
    };
  });
  childNodes.forEach(function(c, i, cs){
    c.operOpt = ["details"];
    if(nodesIds.indexOf(c.id) > -1){
      c.operOpt.push("childNodes");
    };
  })
}

Topology.prototype.resize=function(){
  var container = this.container,
    w=container.clientWidth,
    h=container.clientHeight;
    //this.force = d3.layout.force().gravity(.05).distance(200).charge(-800).size([w, h]);
    this.force.size([w, h]);
    this.vis.attr("width", w).attr("height", h)
    this.update();
}

Topology.prototype.doZoom=function(){
  var str = $(this).attr("transform");
  arrTransl = str.replace("translate(", "").replace(")", "").split(",");
  var diff = d3.event.translate;
  var x = parseFloat(arrTransl[0]) + diff[0];
  var y = parseFloat(arrTransl[1]) + diff[1];
  $(this).parent().find("g").find("image").attr("transform", "scale(" + d3.event.scale + "," + d3.event.scale + ")");
}

//增加节点
Topology.prototype.addNode=function(node){
  this.nodes.push(node);
}

Topology.prototype.addNodes=function(nodes){
  if (Array.isArray(nodes)){
    var self=this;
    nodes.forEach(function(node){
      self.addNode(node);
    });

  }
}

//增加连线
Topology.prototype.addLink=function(source, target, className, isOperLink){
  this.links.push({source:this.findNode(source), target:this.findNode(target), className: className, isOperLink: isOperLink || false});
}

//增加多个连线
Topology.prototype.addLinks=function(links){
  if (Object.prototype.toString.call(links)=='[object Array]' ){
    var self=this;
    links.forEach(function(link){
      var className = "";
      if(!!link.className){className = link.className; }
      self.addLink(link['source'],link['target'], className, link.isOperLink || false);
    });
  }
}


//删除节点
Topology.prototype.removeNode=function(id){
  var i=0,
    n=this.findNode(id),
    links=this.links;
  while ( i < links.length){
    links[i]['source']==n || links[i]['target'] ==n ? links.splice(i,1) : ++i;
  }
  this.nodes.splice(this.findNodeIndex(id),1);
}

//删除节点下的子节点，同时清除link信息
Topology.prototype.removeChildNodes=function(id){
  var node=this.findNode(id),
    nodes=this.nodes;
    links=this.links,
    self=this;

  var linksIdToDelete=[],
    linksToDelete=[],
    childNodes=[];

  var childLinks = JSON.parse(JSON.stringify(this.opt.childLinks));

  childLinks.forEach(function(clink, i ,clinks){
    id == clink["source"]
      && linksIdToDelete.push(clink["target"])
  })

  links.forEach(function(link,index){
    linksIdToDelete.indexOf(link['target'].id) > -1
      && linksToDelete.push(index)
      && childNodes.push(link['target']);
    // link['source']==node
    //   && linksToDelete.push(index)
    //   && childNodes.push(link['target']);
  });

  linksToDelete.reverse().forEach(function(index){
    links.splice(index,1);
  });

  var remove=function(node){
    var length=links.length;
    for(var i=length-1;i>=0;i--){
      if (links[i]['source'] == node ){
         var target=links[i]['target'];
         links.splice(i,1);
         nodes.splice(self.findNodeIndex(node.id),1);
         remove(target);

      }
    }
  }

  childNodes.forEach(function(node){
    remove(node);
  });

  //清除没有连线的节点
  for(var i=nodes.length-1;i>=0;i--){
    var haveFoundNode=false;
    for(var j=0,l=links.length;j<l;j++){
      ( links[j]['source']==nodes[i] || links[j]['target']==nodes[i] ) && (haveFoundNode=true)
    }
    !haveFoundNode && nodes.splice(i,1);
  }
}
Topology.prototype.removeOperNodes=function(node, id){
  //重置是否显示操作项
  node.isShowOper = false;
  var id = node.id;
  var nodes=this.nodes;
  links=this.links,
  self=this,
  todelids = [];
  for (var i = 0; i < links.length; i++) {
    var l = links[i];
    if(l.isOperLink && l.source.id == id){
      todelids.push(l.target.id);
      links.splice(i--,1);
    }
  }
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    if(todelids.indexOf(n.id) > -1){
      nodes.splice(i--,1);
    }
  }
  self.update();
}



//查找节点
Topology.prototype.findNode=function(id){
  var nodes=this.nodes;
  for (var i in nodes){
    if (nodes[i]['id']==id ) return nodes[i];
  }
  return null;
}


//查找节点所在索引号
Topology.prototype.findNodeIndex=function(id){
  var nodes=this.nodes;
  for (var i in nodes){
    if (nodes[i]['id']==id ) return i;
  }
  return -1;
}

Topology.prototype.getChildrenNodes = function(d){
  var self = this;
  //添加子节点时先去除操作节点
  self.removeOperNodes(d);
  if(d._expanded){
    var d_links = _.filter(self.links, function(l){
      return l.source.id == d.id && self.childNodesIds.indexOf(l.target.id) > -1})
    d_links.forEach(function(d_l){
      if(!!d_l.target._expanded){
        d_l.target._expanded = false;
      }
    })
  }
  (function(node, _this){
    if(!node['_expanded']){
      _this.expandNode(node.id);
      node['_expanded']=true;
    }else{
      _this.collapseNode(node.id);
      node['_expanded']=false;
    }
  })(d, self);
}
//更新拓扑图状态信息
Topology.prototype.addOperNode = function(d){
  var self = this;
  if(!!self.currNode && self.currNode !== d){
      self.removeOperNodes(self.currNode);
  }
  self.currNode = d;
  var oper = d.operOpt, nodes = [], links = [];
  if(!!!d.isShowOper){
    if(!!oper && oper.length > 0){
      oper.forEach(function(o, i, objs){
        if(o == "details"){
          nodes.push({id: d.id + "_" + o, name: '查看详细', isOper: true});
        }
        if(o == "childNodes"){
          nodes.push({id: d.id + "_" + o, name: '子节点', isOper: true});
        }
        links.push({source: d.id, target: d.id + '_' + o,className: '', isOperLink: true})
      })
      self.addNodes(nodes);
      self.addLinks(links);

      self.update();
      d.isShowOper = true;
    }
  }else{
    self.removeOperNodes(d);
  }
}
//更新拓扑图状态信息
Topology.prototype.update=function(){
  var self=this;
  var zoom = d3.behavior.zoom()
            .scaleExtent([1,10])//用于设置最小和最大的缩放比例
            .on("zoom",self.doZoom);

  var node = self.vis.selectAll("g.node")
      .data(self.nodes, function(d) { return d.id;});

  var nodeEnter = node.enter();
  var nodeG = nodeEnter.append("svg:g")
      .attr("class", "node")
      .call(self.force.drag)
      .call(zoom);
  //操作节点
  if(!!nodeEnter[0][nodeEnter[0].length - 1] && nodeEnter[0][nodeEnter[0].length - 1].__data__.isOper){
    nodeG.append("svg:text")
        .attr("class", "nodetext")
        .attr("dx", -25)
        .attr("dy", 0)
        .attr("style", "background:red; display:block; cursor: pointer; font-size: 15px")
        .text(function(d) { return d.name })
        .on("click", function(d){
          if(d.name == "查看详细"){
            self.showDetailDialog(self.getParentNode(d));

          }
          if(d.name == "子节点"){
            self.getChildrenNodes(self.getParentNode(d));
          }
        });
  }else{
    //增加图片，可以根据需要来修改
    nodeG.append("svg:image")
        .attr("class", "circle")
        .attr("xlink:href", function(d){
            //根据类型来使用图片
            return d.imgUrl;
          })
        .attr("x", "-32px")
        .attr("y", "-32px")
        .attr("width", "64px")
        .attr("height", "64px")
        .on('click',function(d){
          console.log(d);
          self.addOperNode(d);
        })

    nodeG.append("svg:text")
        .attr("class", "nodetext")
        .attr("dx", 15)
        .attr("dy", -35)
        .text(function(d) { return d.name });
  }
  var link = self.vis.selectAll("line.link")
      .data(self.links, function(d) { return d.source.id + "-" + d.target.id; })

  link.enter()
      .insert("svg:line", "g.node")
      .attr("class", function(d){
          var className = "";
          if(d.isOperLink){
            className = "link operLineClass";
          }else{
            className = d["className"] ? 'link ' + d["className"] : d['source']['status'] && d['target']['status'] ? 'link' :'link link_error'
          }
          return className;
      })
      .transition()
      .duration(5000)
      .styleTween("stroke-dashoffset", function() {
            return d3.interpolateNumber(1000, 0);
        });
  self.force.linkDistance(function(l, i){
    if(!!l.isOperLink){
      return 40;
    }else{
      return 200;
    }
  })
  node.exit().remove();
  link.exit().remove();
  self.force.start();
}

Topology.prototype.getParentNode = function(d){
  var node = null;
  var self = this, links = self.links;
  links.forEach(function(l,i,links){
    if(l.target.id == d.id){
      node = l.source;
      return false;
    }
  });
  return node;
}
Topology.prototype.expandNode = function (id){
  var nodesId = [];
  this.opt.childLinks.forEach(function(l, i, ls){
    if(!!!l.className && l.className != "childLineClass"){
      l.className = "childLineClass";
    }
    if(l.source == id){
      nodesId.push(l.target);
    }
  })
  var nodes = _.filter(this.opt.childNodes, function(n) {
    return nodesId.indexOf(n.id) > -1;
  })
  var links = _.filter(this.opt.childLinks, function(l) {
    return l.source == id;
  })
  this.addNodes(nodes);
  this.addLinks(links);
  this.update();
}

Topology.prototype.collapseNode = function (id){
  this.removeChildNodes(id);
  this.update();
}

Topology.prototype.showDetailDialog = function(d, callback){
  this.removeOperNodes(d)
  $.dialog.basicsDialog({//调用基本弹窗方法
      area: ['350', 'auto'],
      content: d.name,
      title: "提示",
      icon: "success",
      btn: [
        {
          text: "确定",
          fn: function(){
              if(!!callback){
                  callback();
              }
          }
        }
      ]
  })
}