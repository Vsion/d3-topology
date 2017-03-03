function Topology(opt){
  var self=this;
  var content = '<div class="c-top"></div><div class="c-right"></div><div class="c-bottom"></div><div class="c-left"></div>'
    + '<div id="getMoreDiv"><span>查看详细</span></div><div class="topology"></div>';
  if(typeof(opt.dom)=='string'){
    var container = document.querySelector("." + opt.dom) || document.querySelector("#" + opt.dom) ;
    container.innerHTML = content;
    self.container = container.querySelector(".topology");
  };
  var container = self.container,
    w=container.clientWidth,
    h=container.clientHeight;
  self.opt = opt;
  self.childNodesIds = [];
  opt.childNodes.forEach(function(cn){
    self.childNodesIds.push(cn.id);
  })
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
  bindDefaultEvent(self);
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
Topology.prototype.nodeClickFn = function(d){
  var self = this;
  self.clickFn(d);
  if(d._expanded){
    var d_links = _.filter(self.links, function(l){
      return l.source.id == d.id && self.childNodesIds.indexOf(l.target.id) > -1})
    d_links.forEach(function(d_l){
      if(!!d_l.target._expanded){
        d_l.target._expanded = false;
      }
    })
  }
  d.expand && (function(node, _this){
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
Topology.prototype.update=function(){
  var link = this.vis.selectAll("line.link")
      .data(this.links, function(d) { return d.source.id + "-" + d.target.id; })

  link.enter()
      .insert("svg:line", "g.node")
      .attr("class", function(d){
          return d["className"] ? 'link ' + d["className"] : d['source']['status'] && d['target']['status'] ? 'link' :'link link_error';
        })
      .transition()
      .duration(5000)
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
      self.nodeClickFn(d);
    })

  nodeEnter.append("svg:text")
      .attr("class", "nodetext")
      .attr("dx", 15)
      .attr("dy", -35)
      .text(function(d) { return d.name })
      .on('mouseenter',function(d){
        $(this).siblings(".hintimg").show()
      })
      .on('mouseleave',function(d){
        var $this = $(this);
        setTimeout(function(){
          $this.siblings(".hintimg").hide()
        },1000);
      });

  // nodeEnter.append("svg:div")
  //     .attr("width", "64px")
  //     .attr("display", "block")
  //     .attr("position", "absolute")
  //     .attr("top", "0px")
  //     .attr("style", "display: block; height: 64px; width: 64px;")
  //     .attr("height", "64px").text("123")
  var interval = null;
  nodeEnter.append("svg:image")
      .attr("class", "circle hintimg")
      .attr("xlink:href", "./img/hintimg.png")
      .attr("x", "-32px")
      .attr("y", "-32px")
      .attr("width", "64px")
      .attr("width", "64px")
      .attr("height", "64px")
      .attr("style", "display: none; opacity: 0.5; cursor: pointer")
      .on('click',function(d){
        console.log(d);
      })
      .on('mouseenter',function(d){
        var $this = $(this);
        interval = setInterval(function(){
           $this.show();
        },1);
      })
      .on('mouseleave',function(d){
        clearInterval(interval);
        $(this).hide();
      });

  // self.currEle = null;
  // var doms = nodeEnter[0], interval = null;
  // doms.forEach(function(d, i, doms){
  //   if(!!!d)return;
  //   var ele = d.getElementsByTagName("text")[0];
  //   ele.onmouseenter = function(e){
  //     self.currEle = d;
  //     var getMoreDiv = document.getElementById('getMoreDiv');
  //     interval = setGetMoreDivPosi(d, interval);
  //   }
  //   ele.onmouseleave = function(e){
  //     var getMoreDiv = document.getElementById('getMoreDiv');
  //     getMoreDiv.style.display = "none";
  //     clearInterval(interval);
  //   }
  // });

  node.exit().remove();

  this.force.start();
}
// function setGetMoreDivPosi(d, interval){
//   var posi = d.attributes[1].value;//"translate(622.4659587638454,544.701283066796)"
//   posi = posi.replace("translate(", "").replace(")", "").split(",");
//   console.log(posi.toString());
//   interval = setInterval(function(){
//     getMoreDiv.style.display = "block";
//     getMoreDiv.style.left = (posi[0] - 32) + "px";
//     getMoreDiv.style.top = (posi[1] - 32) + "px";
//   }, 100);
//   return interval;
// }

function bindDefaultEvent(self){
  // var mainDiv = document.querySelector("." + self.opt.dom) || document.querySelector("#" + self.opt.dom) ;
  // var getMoreDiv = mainDiv.querySelector("#getMoreDiv");
  // var interval = null;
  // getMoreDiv.onmouseenter = function(){
  //   this.style.display = "block";
  //   interval = setGetMoreDivPosi(self.currEle, interval);
  // }
  // getMoreDiv.onmouseleave = function(){
  //   this.style.display = "none";
  //   clearInterval(interval);
  // }
}