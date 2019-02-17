const nodes : number = 5
const triangles : number = 2
const scGap : number = 0.05
const scDiv : number = 0.51
const sizeFactor : number = 2.9
const strokeFactor : number = 90
const foreColor : string = "#4CAF50"
const backColor : string = "#212121"
const w : number = window.innerWidth
const h : number = window.innerHeight

const maxScale : Function = (scale : number, i : number, n : number) : number => {
    return Math.max(0, scale - i / n)
}

const divideScale : Function = (scale : number, i : number, n : number) : number => {
    return Math.min(1 / n, maxScale(scale, i, n)) * n
}

const scaleFactor : Function = (scale : number) : number => Math.floor(scale / scDiv)

const mirrorValue : Function = (scale : number, a : number, b : number) : number => {
    const k : number = scaleFactor(scale)
    return (1 - k) / a + k / b
}

const updateValue : Function = (scale : number, dir : number, a : number, b : number) : number => {
    return mirrorValue(scale, a, b) * dir * scGap
}


const drawTriangle : Function = (context : CanvasRenderingContext2D, i : number, size : number, scale : number) => {
    const sc1 : number = divideScale(divideScale(scale, 0, 2), i, triangles)
    const sc2 : number = divideScale(divideScale(scale, 1, 2), i, triangles)
    context.save()
    context.translate(-size * (1 - 2 * i) * sc1, 0)
    context.rotate(Math.PI / 2 * sc2)
    context.beginPath()
    context.moveTo(-size, size)
    context.lineTo(size, size)
    context.lineTo(0, -size)
    context.stroke()
    context.restore()
}

const drawTFNode : Function = (context : CanvasRenderingContext2D, i : number, scale : number) => {
    const gap : number = w / (nodes + 1)
    const size : number = gap / sizeFactor
    context.lineCap = 'round'
    context.lineWidth = Math.min(w, h) / strokeFactor
    context.strokeStyle = foreColor
    context.save()
    context.translate(w / 2, gap * (i + 1))
    for (var j = 0; j < 2; j++) {
        drawTriangle(context, i, size, scale)
    }
    context.restore()
}

class TriFacingStage {
    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor
        this.context.fillRect(0, 0, w, h)
    }

    handleTap() {
        this.canvas.onmousedown = () => {

        }
    }

    static init() {
        const stage : TriFacingStage = new TriFacingStage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {
    scale : number = 0
    prevScale : number = 0
    dir : number = 0

    update(cb : Function) {
        this.scale += updateValue(this.scale, this.dir, triangles, triangles)
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {
    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, 50)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class TFNode {
    prev : TFNode
    next : TFNode
    state : State = new State()

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new TFNode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        drawTFNode(context, this.i, this.state.scale)
        if (this.next) {
            this.next.draw(context)
        }
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : TFNode {
        var curr : TFNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class TriFacing {

    root : TFNode = new TFNode(0)
    curr : TFNode = this.root
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.root.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {
    tf : TriFacing = new TriFacing()
    animator : Animator = new Animator()

    render(context : CanvasRenderingContext2D) {
        this.tf.draw(context)
    }

    handleTap(cb : Function) {
        this.tf.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.tf.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }
}
