// smooth scroll

document.querySelectorAll('nav a').forEach(anchor=>{
anchor.addEventListener('click',function(e){

e.preventDefault()

document.querySelector(this.getAttribute('href'))
.scrollIntoView({
behavior:'smooth'
})

})
})


// animated counters

const counters=document.querySelectorAll(".stat h2")

counters.forEach(counter=>{

counter.innerText="0"

const update=()=>{

const target=+counter.getAttribute("data-target")
const c=+counter.innerText

const increment=target/100

if(c<target){

counter.innerText=`${Math.ceil(c+increment)}`

setTimeout(update,20)

}else{

counter.innerText=target

}

}

update()

})


// circuit animation

const canvas=document.getElementById("circuit")
const ctx=canvas.getContext("2d")

canvas.width=window.innerWidth
canvas.height=window.innerHeight

let lines=[]

for(let i=0;i<30;i++){
lines.push({
x:Math.random()*canvas.width,
y:Math.random()*canvas.height,
length:60
})
}

function draw(){

ctx.clearRect(0,0,canvas.width,canvas.height)

ctx.strokeStyle="rgba(0,255,150,0.4)"

lines.forEach(l=>{
ctx.beginPath()
ctx.moveTo(l.x,l.y)
ctx.lineTo(l.x+l.length,l.y)
ctx.stroke()

l.x+=0.4
if(l.x>canvas.width) l.x=0
})

requestAnimationFrame(draw)

}

draw()
