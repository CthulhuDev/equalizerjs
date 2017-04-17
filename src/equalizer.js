import _ from 'lodash'

// TweenLite and TimelineLite are automagically imported with gsap.

// Setting up the app container, its methods and its constants
// main module
export default class Equalizer {

  /**
   * Implements a polyfill for String.prototype.format
   */
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

  /**
   * Initializing default properties, which will then be merged with the one given inside the constructor
   */
  initDefaultProps () {
    // properties and defaults
    this._defaultProps = ({
      "cssPrefix": "equalizer__",
      "mainElementClass": "el",
      "additionalClass": "",
      "rangeSlidersClass": "range__slider",
      "svgClass": "svg",
      "lineClass": "line",
      "animationDuration": 1,
      "linearGradient": {
        id: 'default-gradient',
        stops: [
          {
            offset: '0%',
            stopColor: '#737373',
            stopOpacity: '1'
          },
          {
            offset: '100%',
            stopColor: '#737373',
            stopOpacity: '1'
          }
        ]
      },
      "values": [
        {
          "label": "test_1",
          "defaultPosition": 50,
          "specialClass": ''
        },
        {
          "label": "test_2",
          "defaultPosition": 33,
          "specialClass": ''
        }
      ],
      "aspectRatio" : "3",
      "startingPointY": "50",
      "endingPointY": "50"
    })
  }

  /**
   * Initialize all the private vars available inside the application.
   * These could be initialized inside the constructor but we place them here as a best practice / reminder of whats
   * inside the application.
   */
  initAppVars () {
    // svg namespace
    this._svgNS = 'http://www.w3.org/2000/svg'

    // main html container
    this.container = undefined
    // container of all the inputs (sliders)
    this.inputsContainer = undefined

    // html elements
    this.svg = undefined
    this.svgPath = undefined

    // inputs and thumbs DOM Elements containers
    this._inputs = []
    this._thumbs = []
  }

  /* Accessors methods */

  /**
   * Set newly defined props, merging them with the default ones
   * @param props
   */
  setProps (props) {
    (typeof props !== 'undefined') ? this._props = _.merge(_.cloneDeep(this._defaultProps), props) : this._props = this._defaultProps
  }

  /**
   * Get current props
   * @returns current props*}
   */
  getProps () {
    return this._props
  }

  /* Utility methods */
  /**
   * Sets a class inside the application, merging the given class name with the class prefix
   * @param element - The element to which the class is inserted in
   * @param className - The class name
   */
  setClass (element, className) {
    element.classList.add(this._props.cssPrefix + className)
  }

  /**
   * Quickly tells us if the application is in a locked state or not (can the user move the equalizer?)
   * @returns {boolean|locked}
   */
  isLocked () {
    return typeof this.getProps().locked !== 'undefined' && this.getProps().locked
  }

  /**
   * Given an index, returns an {x,y} object with the coordinates of the thumb inside the application
   * @param idx - index of the thumb inside the _thumbs array
   * @returns {{x: number, y: number}} - array with the coordinates
   */
  getThumbCoordinates (idx) {
    let ar = this.getProps().aspectRatio

    let containerBB = this.container.getBoundingClientRect()
    let thumbBB = this._thumbs[idx].getBoundingClientRect()

    let thumbCenter = thumbBB.left + (thumbBB.width / 2)

    let x = (((thumbCenter - containerBB.left) * 100) / containerBB.width) * ar
    let y = 100 - this._inputs[idx].value
    return {x: x, y: y}
  }

  /* DOM Creation and deletion methods */

  /**
   * Main DOM initialization
   *
   * It initializes:
   *  - The main container
   *  - The inputs container
   *  - Each single input
   *  - The SVG and its path
   *  - An eventual gradient of the path
   */
  initDOM () {
    // setting up a general container, in case we need some css magic
    this.container = this.initContainer()
    // setting up a general container for the inputs, to correctly instantiate the flexbox
    this.inputsContainer = this.initInputsContainer()
    // appending the input container inside the main container
    this.container.appendChild(this.inputsContainer)
    // appending the container to the element
    this.element.appendChild(this.container)


    //setting up inputs
    this.createInputs()
    // creating SVG and, eventually attaching a fancy gradient
    this.createSVG()
    // fancy gradient - if the linearGradient prop is defined, the gradient is static and doesn't change with the user interaction.
    // TODO: document this
    if (typeof this.getProps().linearGradient !== 'undefined') {
      this.drawGradient()
    }
    // attaching svg to the dom
    this.container.appendChild(this.svg)
  }

  /**
   * Return the general container
   * @returns {Element}
   */
  initContainer () {
    let container = document.createElement('div')
    this.setClass(container, 'container')
    return container
  }

  /**
   * Return the inputs container
   * @returns {Element}
   */
  initInputsContainer () {
    let inputsContainer = document.createElement('div')
    // we're using BEM here, we're not adding additional class complexity
    // TODO: document this in the readme, with all the other hardcoded classes.
    this.setClass(inputsContainer, this.getProps().rangeSlidersClass + 's-container')
    return inputsContainer
  }

  /**
   * Creates the SVG and the <path> element inside it, it doesn't return anything
   * it just instantiates the svg and the path inside the class properties
   * svg, svgPath
   */
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

  /**
   * Creating the inputs based of the values array in the props.
   * This method also appends the inputs inside it's container (this.inputsContainer), therefore we should never call this
   * method before the createInputsContainer method has been called.
   */
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

      // adding a fake track for the slider --- fixed firefox z-index madness (thumb and track can't have different z-indexes on ffox, so we also create a new track)
      let track = document.createElement('div')
      this.setClass(track, this.getProps().rangeSlidersClass + '-track')
      inputParent.appendChild(track)

      // adding a label next to the thumb
      let label = document.createElement('div')
      this.setClass(label, this.getProps().rangeSlidersClass + '-label')
      label.innerText = value.label
      inputParent.appendChild(label)

      // appending input to the container
      this.inputsContainer.appendChild(inputParent)

      // eventually adding a class to the input, if defined in the single value config
      if (typeof value.specialClass !== 'undefined' && value.specialClass !== '') {
        // no prefixing on this
        node.classList.add(value.specialClass)
      }

      // updating arrays
      this._inputs.push(node)
      this._thumbs.push(thumb)
    }
  }

  /**
   * Creates a single input range, eventually we can set up a step different from 1
   *
   * @param step - the step of the input range, defaulted to 1
   * @returns {Element}
   */
  createSingleInput (step = 1) {
    // setting up a bare input string that'll be used to create the DOM element
    let input = document.createElement('input')
    input.setAttribute('type', 'range')
    input.setAttribute('min', '0')
    input.setAttribute('max', '100')
    input.setAttribute('step', step.toString())
    input.setAttribute('orient', 'vertical') // orient is needed for firefox and for the css
    this.setClass(input, this.getProps().rangeSlidersClass)

    return input
  }


  /* application methods */

  /**
   * When updateSlider is called, the curve (svgPath) updates itself to go through the thumbs
   */
  updateSlider () {
    // updating SVG logic
    // creating the line element
    let path = this.svgPath
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
      let middlePoint = (point.x + prevPoint.x) / 2
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

  /**
   * updateThumbPosition updates the graphic position of the thumb and the label to match the one of the phantom input thumb
   * @param input
   */
  updateThumbPosition (input) {
    // updating Thumb position logic
    let thumb = input.parentElement.querySelector('.' + this.getProps().cssPrefix + this.getProps().rangeSlidersClass + '-thumb')
    let label = input.parentElement.querySelector('.' + this.getProps().cssPrefix + this.getProps().rangeSlidersClass + '-label')
    let value = input.value
    thumb.style.bottom = value + '%'
    label.style.bottom = value + '%'
  }

  /* reInit functions */

  /**
   * clears the DOM element (and its references, so it will also clear every event attached to his children)
   */
  clearElementDOM () {
    // is there a better way to do it?
    this.element.innerHTML = ""
    // purging arrays
    this._inputs = []
    this._thumbs = []
  }

  /* init events - every event related stuff goes down here. Be it emit or catching or using events */

  /**
   * Setting up all the events
   */
  initEvents () {
    this.animateCurveToPositionAndAbilitateThumbs()
    this.resizeEqualizer()
  }


  /**
   * This function tweens the values and the curve to its initial position
   * It then calls initThumbsEvents to abilitate the user experience on the thumbs for the user
   */
  animateCurveToPositionAndAbilitateThumbs () {
    // TODO: documentate this parameter
    let duration = this.getProps().animationDuration
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
      tl.fromTo([thumb, label], duration, { bottom: '50%' }, { bottom: value + '%' }, 0)
      tl.from(input, duration, { value: 50 }, 0)
    }

    tl.play()
  }

  /**
   * Stuff that has to be done on window.resize
   */
  resizeEqualizer () {
    this.waitingFrame = false
    window.addEventListener('resize', this.resizeFunction.bind(this))
  }

  /**
   * throttled resize function
   */
  resizeFunction () {
    if (this.waitingFrame) return

    this.waitingFrame = true
    requestAnimationFrame(() => {
      this.updateSlider()
      this.waitingFrame = false
    })
  }

  // TODO: create callbacks to place inside the configuration object
  /**
   * Initializing the events that has to be called when the thumbs are moved
   */
  initThumbsEvents () {
    // Cross-browser support where value changes instantly as you drag the handle, therefore two event types.
    for (let input of this._inputs) {
      // removing previous events if the locked value changes from true to false
      input.removeEventListener('input', this.inputChangeCallback)
      input.removeEventListener('change', this.inputChangeCallback)

      // if the app is in the locked state, the user shouldn't be able to interact with the sliders
      if (!this.isLocked()) {
        input.addEventListener('input', this.inputChangeCallback.bind(this))
        input.addEventListener('change', this.inputChangeCallback.bind(this))
      }

      // setting up stuff for the first time
      this.updateThumbPosition(input)
    }
    // setting up the curve for the first time (default position: 50%)
    this.updateSlider()
  }

  /**
   * Stuff that has to be done when the input changes (the thumbs are moved along the track)
   * @param e event
   */
  inputChangeCallback (e) {
    let input = e.target
    if (typeof input !== 'undefined') {
      this.updateSlider()
      this.updateThumbPosition(input)

      // emitting a customEvent on the main element to notify the user something has happened to the inputs
      let inputChangedEvent = new CustomEvent('equalizer-change', {
        detail: {
          'input' : input
        }
      })
      this.element.dispatchEvent(inputChangedEvent)
    }
  }

  /* Methods that are meant to be public */
  /**
   * Draw a linear gradient through the svg
   *  example of linearGradient object:
   * {
   * id: String,
   * stops: [
   *   {
   *     offset: String,
   *     stopColor: String,
   *     stopOpacity: String
   *   },
   *   ...
   *  ]
   * }
   *
   * It takes the object either from the properties, or if externally called from the parameter
   *
   * @param linearGradient  - the object with the informations
   */
  drawGradient (linearGradient = undefined) {
    let lg = (typeof linearGradient !== 'undefined') ? linearGradient : this.getProps().linearGradient
    let NS = this._svgNS

    // setting up the defs container and the linear gradient general stuff
    let defs = document.createElementNS(NS, 'defs')
    // linear gradient tag
    let linearGradientEl = document.createElementNS(NS, 'linearGradient')
    linearGradientEl.setAttribute('id', lg.id)
    // fixing straight line not showing gradient cause of element svg boxing
    linearGradientEl.setAttribute('gradientUnits', 'userSpaceOnUse')
    // setting up stops
    for (let stop of lg.stops) {
      let stopEl = document.createElementNS(NS, 'stop')
      stopEl.setAttribute('offset', stop.offset)
      stopEl.setAttribute('stop-color', stop.stopColor)
      stopEl.setAttribute('stop-opacity', stop.stopOpacity)
      linearGradientEl.appendChild(stopEl)
    }

    // appending linear gradient to SVG and making use of it
    defs.appendChild(linearGradientEl)
    this.svg.insertBefore(defs, this.svgPath)

    // chrome gives problems with gradient and straight paths, so if all values are === then we won't set any gradient
    this.svgPath.setAttribute('style', 'stroke: url(#{0})'.format(lg.id))
  }

  /**
   * Take an array of stops colors and animate the current stops to the one desired.
   * Stops can be of any length, if there are less stops here than in the actual gradient, only the first N stops
   * of the gradient will be animated. If there are more, the additional stop colors will remain unused
   *
   * If there's the need to change completely the curve, and its number of stops, drawGradient should be called
   * @param stops
   */
  changeGradient (stops) {
    let duration = this.getProps().animationDuration
    let stopsElement = this.svg.querySelectorAll('defs linearGradient stop')

    let i = 0
    for (let stopElement of stopsElement) {
      if (typeof stops[i] !== 'undefined') {
        TweenLite.to(stopElement, duration, { attr: { 'stop-color': stops[i] } })
      }
      i+=1
    }
  }

  /* Constructor and initialization methods */

  /**
   * Initialize the app, the events and the DOM.
   * It dispatches an event on init done
   */
  reInit () {
    // setting element class
    this.setClass(this.element, this.getProps().mainElementClass)
    this.setClass(this.element, this.getProps().additionalClass)

    // destroying old DOM
    this.clearElementDOM()

    // creating new DOM
    this.initDOM()

    this.initEvents()
    console.log('here ', this.element)
    // dispatching event
    this.element.dispatchEvent(new Event('equalizer-init'))
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

window.Equalizer = Equalizer