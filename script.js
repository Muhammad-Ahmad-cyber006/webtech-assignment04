var STORAGE_KEY="markdownSlides";
var startLines=["# This is Slide 01","",
  "## This is Heading 02 in slide 01","",
  "### This is Heading 03","",
  "#### This is Heading 04","",
  "##### This is Heading 05","",
  "###### This is Heading 06","",
  "This is your content on slide 01","",
  "---",
  "",
  "# This is Slide 02","","## This is Heading 02 in slide 02","","This is your content on slide 02"
  ,"",
  "---",
  "",
  "# This is Slide 03","","Add more slides with three dashes.","","Press Ctrl + S to save."];
var startText=startLines.join("\n");

var input=document.getElementById("markdownInput");
var previewSlide=document.getElementById("previewSlide");
var presentationSlide=document.getElementById("presentationSlide");
var editorView=document.getElementById("editorView");
var presentationView=document.getElementById("presentationView");
var saveStatus=document.getElementById("saveStatus");

var slides=[];
var currentSlide=0;
var isPresenting=false;

try
{
  input.value=localStorage.getItem(STORAGE_KEY)||startText;
}
catch(e)
{
  input.value=startText;
}
function escapeHtml(v)
{
  return v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function inlineMarkdown(t)
{
  var o=escapeHtml(t);
  o=o.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>");
  o=o.replace(/\*(.+?)\*/g,"<em>$1</em>");
  return o;
}
function renderMarkdown(md)
{
  var lines=md.trim().split("\n");
  var html="";
  var listType="";
  function closeList()
  {
    if(listType!="")
    {
      html+="</"+listType+">";
      listType="";
    }
  }
  for(var i=0;i<lines.length;i++)
  {
    var line=lines[i].trim();
    if(line=="")
    {
      closeList();
      continue;
    }
    var m;
    m=line.match(/^(#{1,6})\s+(.+)$/);
    if(m)
    {
      closeList();
      var lv=m[1].length;
      html+="<h"+lv+">"+inlineMarkdown(m[2])+"</h"+lv+">";
      continue;
    }
    if(/^[-*_]{3,}$/.test(line))
    {
      closeList();
      continue;
    }
    m=line.match(/^[-*+]\s+(.+)$/);
    if(m)
    {
      if(listType!="ul")
      {
        closeList();
        html+="<ul>";
        listType="ul";
      }
      html+="<li>"+inlineMarkdown(m[1])+"</li>";
      continue;
    }
    m=line.match(/^\d+[.)]\s+(.+)$/);
    if(m)
    {
      if(listType!="ol")
      {
        closeList();
        html+="<ol>";
        listType="ol";
      }
      html+="<li>"+inlineMarkdown(m[1])+"</li>";
      continue;
    }
    m=line.match(/^>\s?(.+)$/);
    if(m)
    {
      closeList();
      html+="<blockquote>"+inlineMarkdown(m[1])+"</blockquote>";
      continue;
    }
    closeList();
    html+="<p>"+inlineMarkdown(line)+"</p>";
  }
  closeList();
  if(html=="")
  {
    return "<p class='empty-slide'>Empty slide. Add some Markdown.</p>";
  }
  return html;
}

function parseSlides()
{
  var parts=input.value.split(/^\s*---\s*$/m);
  var r=[];
  for(var i=0;i<parts.length;i++)
  {
    var s=parts[i].trim();
    if(s.length>0||parts.length==1)
    {
      r.push(s);
    }
  }
  return r;
}

// draw
function render()
{
  slides=parseSlides();
  if(slides.length==0)
  {
    slides=[""];
  }
  if(currentSlide>slides.length-1)
  {
    currentSlide=slides.length-1;
  }
  if(currentSlide<0)
  {
    currentSlide=0;
  }
  previewSlide.innerHTML=renderMarkdown(slides[currentSlide]);
  presentationSlide.innerHTML=renderMarkdown(slides[currentSlide]);
  updateControls();
  document.getElementById("slideCountEditor").innerHTML=slides.length+(slides.length==1?" slide":" slides");
}

// counters + buttons
function updateControls()
{
  var total=slides.length;
  var atStart=currentSlide==0;
  var atEnd=currentSlide==total-1;
  document.getElementById("previewCounter").innerHTML=(currentSlide+1)+" / "+total;
  document.getElementById("presentationCounter").innerHTML=(currentSlide+1)+" / "+total;
  document.getElementById("prevPreview").disabled=atStart;
  document.getElementById("prevPresentation").disabled=atStart;
  document.getElementById("nextPreview").disabled=atEnd;
  document.getElementById("nextPresentation").disabled=atEnd;
  var ft=isPresenting?"Exit Full Screen":"Full Screen";
  document.getElementById("fullscreenPreview").innerHTML=ft;
  document.getElementById("fullscreenPresentation").innerHTML=ft;
  document.getElementById("presentBtn").innerHTML=isPresenting?"Back to Editor":"Present";
}

// jump
function goToSlide(i)
{
  if(i<0)
  {
    i=0;
  }
  if(i>slides.length-1)
  {
    i=slides.length-1;
  }
  currentSlide=i;
  render();
}

// save
function saveSlides()
{
  try
  {
    localStorage.setItem(STORAGE_KEY,input.value);
    saveStatus.innerHTML="Saved";
  }
  catch(e)
  {
    saveStatus.innerHTML="Could not save";
  }
}

function togglePresentation()
{
  if(isPresenting==false)
  {
    isPresenting=true;
    presentationView.style.display="flex";
    editorView.style.display="none";
    document.body.style.overflow="hidden";
    render();
  }
  else
  {
    exitPresentation();
  }
  updateControls();
}

function exitPresentation()
{
  isPresenting=false;
  presentationView.style.display="none";
  editorView.style.display="block";
  document.body.style.overflow="";
  updateControls();
}

// fullscreen
function toggleFullscreen()
{
  if(!document.fullscreenElement)
  {
    if(isPresenting)
    {
      presentationView.requestFullscreen().catch(function(){});
    }
    else
    {
      document.documentElement.requestFullscreen().catch(function(){});
    }
  }
  else
  {
    document.exitFullscreen();
  }
}

// typing
input.oninput=function()
{
  render();
  saveStatus.innerHTML="Unsaved";
};

// buttons
document.getElementById("saveBtn").onclick=saveSlides;
document.getElementById("presentBtn").onclick=togglePresentation;
document.getElementById("backToEditor").onclick=exitPresentation;
document.getElementById("prevPreview").onclick=function()
{
  goToSlide(currentSlide-1);
};
document.getElementById("nextPreview").onclick=function()
{
  goToSlide(currentSlide+1);
};
document.getElementById("prevPresentation").onclick=function()
{
  goToSlide(currentSlide-1);
};
document.getElementById("nextPresentation").onclick=function()
{
  goToSlide(currentSlide+1);
};
document.getElementById("fullscreenPreview").onclick=toggleFullscreen;
document.getElementById("fullscreenPresentation").onclick=toggleFullscreen;

// keys
document.onkeydown=function(e)
{
  if(e.ctrlKey&&e.key.toLowerCase()=="s")
  {
    e.preventDefault();
    saveSlides();
    return;
  }
  if(e.key=="F11")
  {
    e.preventDefault();
    toggleFullscreen();
    return;
  }
  if(document.activeElement===input)
  {
    return;
  }
  if(e.key=="ArrowRight")
  {
    e.preventDefault();
    goToSlide(currentSlide+1);
  }
  if(e.key=="ArrowLeft")
  {
    e.preventDefault();
    goToSlide(currentSlide-1);
  }
  if(e.key=="Escape"&&isPresenting)
  {
    exitPresentation();
  }
};

document.addEventListener("fullscreenchange",updateControls);

window.onbeforeunload=function()
{
  try
  {
    localStorage.setItem(STORAGE_KEY,input.value);
  }
  catch(e)
  {
  }
};

render();