import _ from 'lodash'
import { TimelineLite } from 'gsap'

// Setting up the app container, its methods and its constants
// main module
class Equalizer {

  initDefaultProps () {
    // properties and defaults
    this._defaultProps = ({
      "cssPrefix": "equalizer__",
      "mainElementClass": "el",
      "additionalClass": "",
      "rangeSlidersClass": "range__slider",
      "svgClass": "svg",
      "lineClass": "line",
      "linearGradient": undefined,
      "values": [
        {
          "label": "test_1",
          "defaultPosition": 50
        },
        {
          "label": "test_2",
          "defaultPosition": 33
        }
      ],
      "aspectRatio" : "3",
      "startingPointY": "50",
      "endingPointY": "50"
    })
  }

  initAppVars () {
    // svg namespace
    this._svgNS = 'http://www.w3.org/2000/svg'

    // inputs and thumbs DOM Elements containers
    this._inputs = []
    this._thumbs = []
  }

  // TODO: place some undefined placeholders here for container, svg etc

  /**
   * Set a class on an element adding the cssPrefix
   */
  setClass (element, className) {
    element.classList.add(this._props.cssPrefix + className)
  }

  /* merge default props with given ones */
  setProps (props) {
    (typeof props !== 'undefined') ? this._props = _.merge(_.cloneDeep(this._defaultProps), props) : this._props = this._defaultProps
  }

  /* props getter */
  getProps () {
    return this._props
  }

  /* get coordinates for the SVG of a thumb */
  getThumbCoordinates (idx) {
    let ar = this.getProps().aspectRatio

    let containerBB = this.container.getBoundingClientRect()
    let thumbBB = this._thumbs[idx].getBoundingClientRect()

    let thumbCenter = Math.abs(thumbBB.left + (thumbBB.width / 2))

    let x = (((thumbCenter - containerBB.left) * 100) / containerBB.width) * ar
    let y = 100 - this._inputs[idx].value
    return {x: x, y: y}
  }

  /* application methods --- */

  // update the slider, animate = true uses tweenmax to animate the value to the desired position
  updateSlider () {
    // updating SVG logic
    // creating the line element
    let path = this.svgPath
    let NS = this._svgNS
    // setting up starting point
    let d = "M {0},{1} L {2},{3} ".format(
      0, this.getProps().startingPointY,
      0, this.getProps().startingPointY
    )

    // adding up a fake input to simulate the end point
    let inputs = _.union(this._inputs, [{ x: 100 * this.getProps().aspectRatio, y: this.getProps().endingPointY }])

    // funny part, passing through the points, TODO: dynamic control points
    for (let idx in inputs) {
      let input = inputs[idx]
      let prevPoint = (parseInt(idx) === 0) ? { x: 0, y: this.getProps().startingPointY } : this.getThumbCoordinates(idx - 1)
      let point = (parseInt(idx) === inputs.length - 1) ? input : this.getThumbCoordinates(idx)
      let middlePoint = Math.abs((point.x + prevPoint.x) / 2)
      // let's assume, for now, that the control points are simply half way and straight
      let curve = "C {0},{1} {2},{3} {4},{5} ".format(
        middlePoint, prevPoint.y,
        middlePoint, point.y,
        point.x, point.y
      )
      d += curve
    }


    path.setAttribute('d', d)
  }

  updateThumbPosition (input) {
    // updating Thumb position logic
    let thumb = input.parentElement.querySelector('.' + this.getProps().cssPrefix + this.getProps().rangeSlidersClass + '-thumb')
    let label = input.parentElement.querySelector('.' + this.getProps().cssPrefix + this.getProps().rangeSlidersClass + '-label')
    let value = input.value
    thumb.style.bottom = value + '%'
    label.style.bottom = value + '%'
  }

  /* reInit functions --- */

  /* clear element DOM */
  clearElementDOM () {
    this.element.innerHTML = ""
    //is there a better way to do it?

    // purging arrays
    this._inputs = []
    this._thumbs = []
  }


  initThumbsEvents () {
    // Cross-browser support where value changes instantly as you drag the handle, therefore two event types.
    for (let input of this._inputs) {
      if (!this.isLocked()) {
        input.addEventListener('input', e => {
          if (typeof e.target !== 'undefined') {
          this.updateSlider()
          this.updateThumbPosition(e.target)
        }
      })
        input.addEventListener('change', e => {
          if (typeof e.target !== 'undefined') {
          this.updateSlider()
          this.updateThumbPosition(e.target)
        }
      })
      }
      // setting up stuff for the first time
      this.updateThumbPosition(input)
    }
    this.updateSlider()
  }

  /* init events */
  initEvents () {
    // animating for the first time
    let tl = new TimelineLite({
      paused: true,
      onComplete: () => {
        // setting up events for thumbs
        this.initThumbsEvents()
      },
      onUpdate: () => {
        this.updateSlider()
      }
    })
    for (let input of this._inputs) {
      let thumb = input.parentElement.querySelector('.' + this.getProps().cssPrefix + this.getProps().rangeSlidersClass + '-thumb')
      let label = input.parentElement.querySelector('.' + this.getProps().cssPrefix + this.getProps().rangeSlidersClass + '-label')
      let value = input.value
      tl.fromTo([thumb, label],
        0.5,
        {
          bottom: '50%'
        },
        {
          bottom: value + '%'
        },
        0
      )
      tl.from(input, 0.5, {
        value: 50
      }, 0)
    }
    tl.play()
  }

  /* init element DOM */
  initDOM () {
    // setting up a general container, in case we need some css magic
    this.container = document.createElement('div')
    this.setClass(this.container, 'container')
    // setting up a general container for the inputs, to correctly instantiate the flexbox
    this.inputsContainer = document.createElement('div')
    this.setClass(this.inputsContainer, this.getProps().rangeSlidersClass + 's-container')
    this.container.appendChild(this.inputsContainer)
    // appending the container to the element
    this.element.appendChild(this.container)
    //setting up inputs
    this.createInputs()
    // creating SVG and, eventually attaching a fancy gradient
    this.createSVG()
    if (typeof this.getProps().linearGradient !== 'undefined') {
      this.drawGradient()
    }
    // attaching svg to the dom
    this.container.appendChild(this.svg)


  }

  /* dom creation routines --- */

  createSingleInput () {
    // setting up a bare input string that'll be used to create the DOM element
    let input = document.createElement('input')
    input.setAttribute('type', 'range')
    input.setAttribute('min', '0')
    input.setAttribute('max', '100')
    input.setAttribute('step', '1')
    input.setAttribute('orient', 'vertical')
    this.setClass(input, this.getProps().rangeSlidersClass)

    return input
  }

  /* create inputs based on given config values */
  createInputs () {
    // creating an input for each value defined in props
    for (let value of this.getProps().values) {
      let node =  this.createSingleInput()
      // checking that the value is a valid value
      let finalValue = (value.defaultPosition >= 0 && value.defaultPosition <= 100) ? value.defaultPosition : 50
      node.value = finalValue
      node.setAttribute('value', finalValue)

      // encapsulating input inside a parent div
      let inputParent = document.createElement('div')
      this.setClass(inputParent, this.getProps().rangeSlidersClass + '-container') // no need to create a new config value, we're using BEM here
      inputParent.appendChild(node)

      // adding a fake thumb for the slider
      let thumb = document.createElement('div')
      this.setClass(thumb, this.getProps().rangeSlidersClass + '-thumb')
      inputParent.appendChild(thumb)

      // adding a label next to the thumb
      let label = document.createElement('div')
      this.setClass(label, this.getProps().rangeSlidersClass + '-label')
      label.innerText = value.label
      inputParent.appendChild(label)

      // appending input to the container
      this.inputsContainer.appendChild(inputParent)
      // updating arrays
      this._inputs.push(node)
      this._thumbs.push(thumb)
    }
  }

  /* instantiating a linear gradient on the path
   TODO: extend the function to be compliant with each linear gradient feature
   */
  drawGradient () {
    /* draw a linear gradient through the svg */
    /* 
     example of lineGradient object:
     {
     id: String,
     location: {
     x1: String,
     y1: String,
     x2: String,
     y2: String
     },
     stops: [
     {
     offset: String,
     stopColor: String,
     stopOpacity: String
     },
     ...
     ]
     }
     */
    let lg = this.getProps().linearGradient
    let NS = this._svgNS

    // setting up the defs container and the linear gradient general stuff
    let defs = document.createElementNS(NS, 'defs')
    // linear gradient tag
    let linearGradient = document.createElementNS(NS, 'linearGradient')
    linearGradient.setAttribute('id', lg.id)
    if (typeof lg.location !== 'undefined') {
      linearGradient.setAttribute('x1', lg.location.x1)
      linearGradient.setAttribute('y1', lg.location.y1)
      linearGradient.setAttribute('x2', lg.location.x2)
      linearGradient.setAttribute('y2', lg.location.y2)
    }
    // setting up stops
    for (let stop of lg.stops) {
      let stopEl = document.createElementNS(NS, 'stop')
      stopEl.setAttribute('offset', stop.offset)
      stopEl.setAttribute('stop-color', stop.stopColor)
      stopEl.setAttribute('stop-opacity', stop.stopOpacity)
      linearGradient.appendChild(stopEl)
    }

    // appending linear gradient to SVG and making use of it
    defs.appendChild(linearGradient)
    this.svg.insertBefore(defs, this.svgPath)
    this.svgPath.setAttribute('style', 'stroke: url(#{0})'.format(lg.id))
  }

  createSVG () {
    let ar = this.getProps().aspectRatio
    let NS = this._svgNS
    let svg = document.createElementNS(NS, 'svg')

    // setting up properties
    // the svg and the application will ALWAYS be scaled as if it were a
    // N:1 aspect ratio, for convenience
    let width = ar * 100
    let height = 100
    svg.setAttributeNS(null, 'width', width + 'px')
    svg.setAttributeNS(null, 'height', height + 'px')
    svg.setAttributeNS(null, 'viewBox', '0 0 ' + width + ' ' + height)
    this.setClass(svg, this.getProps().svgClass)

    // creating the path
    let path = document.createElementNS(NS, 'path')
    // setting vector-effect="non-scaling-stroke" so that the stroke doesn't get bigger as the viewport goes up
    path.setAttribute('vector-effect', 'non-scaling-stroke')
    path.setAttribute('d', '')
    this.setClass(path, this.getProps().lineClass)

    svg.appendChild(path)

    this.svgPath = path
    this.svg = svg
    // appending the SVG to the container
  }

  isLocked () {
    return typeof this.getProps().locked !== 'undefined' && this.getProps().locked
  }

  /* update component */
  reInit (callback = undefined) {
    // setting element class
    this.setClass(this.element, this.getProps().mainElementClass)
    this.setClass(this.element, this.getProps().additionalClass)

    // destroying old DOM
    this.clearElementDOM()

    // creating new DOM
    this.initDOM()

    this.initEvents()
  }

  static formatPolyfill () {
    // String formatter polyfill
    if (!String.prototype.format) {
      String.prototype.format = function() {
        let args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
          return typeof args[number] != 'undefined' ? args[number] : match;
        })
      }
    }
  }

  // init tha thing
  constructor (element, props = undefined) {
    // setupping string format polyfill
    Equalizer.formatPolyfill()

    this.initDefaultProps()

    this.initAppVars()

    // main parent
    this.element = element
    // merging the given properties with the default ones
    this.setProps(props)
    // creating the DOM and updating the component after a Prop update
    this.reInit()

  }
}

export { Equalizer }
window.Equalizer = Equalizer