function Topology(opt){
  var self=this;
  var content = '<div class="c-top"></div><div class="c-right"></div><div class="c-bottom"></div><div class="c-left"></div><div class="topology"></div>';
  if(typeof(opt.dom)=='string'){
    var container = document.querySelector("." + opt.dom);
    container.innerHTML = content;
    self.container = container.querySelector(".topology");
  };
  var container = self.container,
    w=container.clientWidth,
    h=container.clientHeight;
  self.opt = opt;
  self.force = d3.layout.force().gravity(.05).distance(200).charge(-800).size([w, h]);
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

  (function(_this, _opt){
    _this.addNodes(_opt.nodes);
    _this.addLinks(_opt.links);
    _this.update();
  })(self, opt);
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
  d3.select(this).select('g').attr("transform","translate(" + d3.event.translate + ")"+ " scale(" + d3.event.scale + ")");
}

//增加节点
Topology.prototype.addNode=function(node){
  this.nodes.push(node);
}

Topology.prototype.addNodes=function(nodes){
  if (Object.prototype.toString.call(nodes)=='[object Array]' ){
    var self=this;
    nodes.forEach(function(node){
      self.addNode(node);
    });

  }
}

//增加连线
Topology.prototype.addLink=function(source, target, className){
  this.links.push({source:this.findNode(source), target:this.findNode(target), className});
}

//增加多个连线
Topology.prototype.addLinks=function(links){
  if (Object.prototype.toString.call(links)=='[object Array]' ){
    var self=this;
    links.forEach(function(link){
      var className = "";
      if(!!link.className){className = link.className; }
      self.addLink(link['source'],link['target'], className);
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

Topology.prototype.expandNode = function (id){
  this.addNodes(this.opt.childNodes);
  this.addLinks(this.opt.childLinks);
  this.update();
}

Topology.prototype.collapseNode = function (id){
  this.removeChildNodes(id);
  this.update();
}
//更新拓扑图状态信息
Topology.prototype.update=function(){
  var link = this.vis.selectAll("line.link")
      .data(this.links, function(d) { return d.source.id + "-" + d.target.id; })
    .attr("class", function(d){
      return d["className"] ? 'link ' + d["className"] : d['source']['status'] && d['target']['status'] ? 'link' :'link link_error';
    });

  link.enter().insert("svg:line", "g.node")
      .attr("class", function(d){
     return d["className"] ? 'link ' + d["className"] : d['source']['status'] && d['target']['status'] ? 'link' :'link link_error';
    }) .transition()
         .duration(4000)
         .styleTween("stroke-dashoffset", function() {
             return d3.interpolateNumber(1000, 0);
         });;

  link.exit().remove();

  var node = this.vis.selectAll("g.node")
      .data(this.nodes, function(d) { return d.id;});

  var nodeEnter = node.enter().append("svg:g")
      .attr("class", "node")
      .call(this.force.drag);

  //增加图片，可以根据需要来修改
  var self=this;
  nodeEnter.append("svg:image")
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
      self.clickFn(d);
      d.expand && (function(node, _this){
        if(!node['_expanded']){
          _this.expandNode(node.id);
          node['_expanded']=true;
        }else{
          _this.collapseNode(node.id);
          node['_expanded']=false;
        }
      })(d, self);
    })

  nodeEnter.append("svg:text")
      .attr("class", "nodetext")
      .attr("dx", 15)
      .attr("dy", -35)
      .text(function(d) { return d.name });

  node.exit().remove();

  this.force.start();
}