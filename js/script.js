const math = {
  lerp: (a, b, n) => {
    return (1 - n) * a + n * b
  },
  norm: (value, min, max) => {
    return (value - min) / (max - min)
  }
}

const config = {
  height: window.innerHeight,
  width: window.innerWidth
}

class Smooth {
  constructor () {
    this.bindAll()

    this.el = document.querySelector('[data-scroll]')
    this.content = [...document.querySelectorAll('[data-scroll-content]')]

    this.dom = {
      el: this.el,
      content: this.content,
      elems: [[...this.content[0].querySelectorAll('.js-slide')], [...this.content[1].querySelectorAll('.js-slide')]],
      handle: this.el.querySelector('.js-scrollbar__handle')
    }

    this.data = {
      total: this.dom.elems[0].length - 1,
      current: 0,
      last: {
        one: 0,
        two: 0
      },

      on: 0,
      off: 0
    }

    this.bounds = {
      elem: 0,
      content: 0,
      width: 0,
      max: 0,
      min: 0
    }

    this.state = { dragging: false }

    this.rAF = null
    this.parallax = null

    this.init()
  }

  bindAll () {
    ['scroll', 'run', 'resize']
      .forEach(fn => this[fn] = this[fn].bind(this))
  }

  setStyles () {
    this.dom.el.style.position = 'fixed'
    this.dom.el.style.top = 0
    this.dom.el.style.left = 0
    this.dom.el.style.height = '100%'
    this.dom.el.style.width = '100%'
    this.dom.el.style.overflow = 'hidden'
  }

  setBounds (elems) {
    let w = 0

    elems.forEach((el, index) => {
      const bounds = el.getBoundingClientRect()

      el.style.position = 'absolute'
      el.style.top = 0
      el.style.left = `${w}px`

      w = w + bounds.width

      this.bounds.width = w
      this.bounds.max = this.bounds.width - config.width

      console.log(this.bounds.width, this.bounds.max)

      if (this.data.total === index && elems === this.dom.elems[0]) {
        this.dom.content[0].style.width = `${w}px`
        this.dom.content[1].style.width = `${w}px`
        document.body.style.height = `${w}px`
      }
    })
  }

  resize () {
    this.setBounds(this.dom.elems[0])
    this.setBounds(this.dom.elems[1])
    this.scroll()
  }

  preload () {
    imagesLoaded(this.dom.content, instance => {
      this.setBounds(this.dom.elems[0])
      this.setBounds(this.dom.elems[1])
    })
  }

  scroll () {
    if (this.state.dragging) return

    this.data.current = window.scrollY
    this.clamp()
  }

  drag (e) {
    this.data.current = window.scrollY - (e.clientX - this.data.on)
    this.clamp()
  }

  clamp () {
    this.data.current = Math.min(Math.max(this.data.current, 0), this.bounds.max)
  }

  run () {
    this.data.last.one = math.lerp(this.data.last.one, this.data.current, 0.085)
    this.data.last.one = Math.floor(this.data.last.one * 100) / 100

    this.data.last.two = math.lerp(this.data.last.two, this.data.current, 0.08)
    this.data.last.two = Math.floor(this.data.last.two * 100) / 100

    const diff = this.data.current - this.data.last.one
    const acc = diff / config.width
    const velo = +acc
    const bounce = 1 - Math.abs(velo * 0.25)
    const skew = velo * 7.5

    this.dom.content[0].style.transform = `translate3d(-${this.data.last.one.toFixed(2)}px, 0, 0) scaleY(${bounce}) skewX(${skew}deg)`
    this.dom.content[1].style.transform = `translate3d(-${this.data.last.two.toFixed(2)}px, 0, 0) scaleY(${bounce})`

    const scale = math.norm(this.data.last.two, 0, this.bounds.max)

    this.dom.handle.style.transform = `scaleX(${scale})`

    this.requestAnimationFrame()
  }

  on () {
    this.setStyles()
    this.setBounds(this.dom.elems[0])
    this.setBounds(this.dom.elems[1])
    this.addEvents()

    this.requestAnimationFrame()
  }

  requestAnimationFrame () {
    this.rAF = requestAnimationFrame(this.run)
  }

  resize () {
    this.setBounds()
  }

  addEvents () {
    window.addEventListener('scroll', this.scroll, { passive: true })

    this.dom.el.addEventListener('mousemove', e => {
      if (!this.state.dragging) return

      this.drag(e)
    }, { passive: true })

    this.dom.el.addEventListener('mousedown', e => {
      this.state.dragging = true
      this.data.on = e.clientX
    })

    window.addEventListener('mouseup', () => {
      this.state.dragging = false
      window.scrollTo(0, this.data.current)
    })
  }

  init () {
    this.preload()
    this.on()
  }
}

class Transition {
  constructor () {
    this.dom = {
      mask: document.querySelector('.js-mask'),
      slices: [...document.querySelectorAll('.js-mask__slice')],
      triggers: [...document.querySelectorAll('.js-trigger')],
      lines: [...document.querySelectorAll('.js-mask-line')],
      logo: document.querySelector('.js-logo'),
      images: [...document.querySelectorAll('.js-transition-img')],
      imagesInner: [...document.querySelectorAll('.js-transition-img__inner')],
      titles: [...document.querySelectorAll('.js-transition-title')]
    }

    this.tl = null

    this.state = false

    this.init()
  }

  resetScroll () {
    window.scrollTo(0, 0)
  }

  createTimeline () {
    this.tl = new TimelineMax({
      paused: true,
      onComplete: () => {
        this.state = false
      }
    })

    this.tl
      .set([this.dom.images, this.dom.imagesInner], {
        xPercent: 0,
        scale: 1
      })

      .set(this.dom.titles, { yPercent: 0 })

      .set(this.dom.mask, { autoAlpha: 1 })

      .staggerFromTo(this.dom.slices, 1.5, { xPercent: 100 },
        {
          xPercent: 0,
          ease: Expo.easeInOut
        },
        -0.075)

      .addCallback(this.resetScroll.bind(this))
      .addLabel('loaderStart')

      .set(this.dom.images, { xPercent: -100 })

      .set(this.dom.imagesInner, { xPercent: 100 })

      .set(this.dom.titles, { yPercent: -100 })

      .set([this.dom.lines[0], this.dom.logo], { autoAlpha: 1 })

      .fromTo(this.dom.logo, 1, {
        yPercent: -100,
        rotation: 10
      },
      {
        yPercent: 0,
        rotation: 0,
        ease: Expo.easeOut
      })

      .staggerFromTo(this.dom.lines, 1, { scaleX: 0 },
        {
          scaleX: 1,
          ease: Expo.easeInOut
        },
        0.75, '-=1')
      .set(this.dom.lines, { transformOrigin: 'right' })

      .fromTo(this.dom.lines[0], 1, { scaleX: 1 },
        {
          scaleX: 0,
          ease: Expo.easeInOut
        })

      .fromTo(this.dom.logo, 1, { yPercent: 0 },
        {
          yPercent: 105,
          ease: Expo.easeOut
        },
        '-=1')
      .staggerFromTo(this.dom.slices, 1.5, { xPercent: 0 },
        {
          xPercent: 100,
          ease: Expo.easeInOut
        },
        0.075)
      .set(this.dom.mask, { autoAlpha: 0 })

      .addLabel('imagesStart', '-=0.85')

      .staggerFromTo(this.dom.titles, 1.5, { yPercent: 100 },
        {
          yPercent: 0,
          ease: Expo.easeInOut
        },
        0.05, 'imagesStart')
      .staggerFromTo(this.dom.images, 1.25, { xPercent: -100 },
        {
          xPercent: 0,
          ease: Expo.easeInOut
        },
        0.05, 'imagesStart')
      .staggerFromTo(this.dom.imagesInner, 1.25, { xPercent: 100 },
        {
          xPercent: 0,
          ease: Expo.easeInOut
        },
        0.05, 'imagesStart')

      .addLabel('loaderEnd')
  }

  addEvents () {
    this.dom.triggers.forEach(trigger => {
      trigger.addEventListener('click', e => {
        e.preventDefault()

        if (this.state) return

        this.dom.triggers.forEach(el => { el.classList.remove('is-active') })
        trigger.classList.add('is-active')

        this.state = true
        this.tl.restart()
      })
    })
  }

  loader () {
    this.resetScroll()
    this.tl.tweenFromTo('loaderStart', 'loaderEnd')
  }

  init () {
    this.createTimeline()
    this.addEvents()
    this.loader()
  }
}

// Init classes
const smooth = new Smooth()
const transition = new Transition()

// See shot - hover
const btn = document.querySelector('.js-menu-btn')

btn.addEventListener('mouseenter', () => {
  TweenMax.to('.js-menu-btn__circle--bottom', 0.5, {
    y: 15,
    alpha: 0,
    ease: Expo.easeOut
  })

  TweenMax.set('.js-menu-btn__circle--top', { autoAlpha: 1 })

  TweenMax.fromTo('.js-menu-btn__circle--top', 0.75, { y: -60 },
    {
      y: 0,
      ease: Bounce.easeOut
    })
})

btn.addEventListener('mouseleave', () => {
  TweenMax.to('.js-menu-btn__circle--top', 0.5, {
    y: 15,
    alpha: 0,
    ease: Expo.easeOut
  })

  TweenMax.set('.js-menu-btn__circle--bottom', { autoAlpha: 1 })

  TweenMax.fromTo('.js-menu-btn__circle--bottom', 0.75, { y: -60 },
    {
      y: 0,
      ease: Bounce.easeOut
    })
})

// Get the modal
const modal = document.getElementById('myModal')

// Get the image and insert it inside the modal - use its "alt" text as a caption
const img = document.querySelectorAll('.myImg')
const modalImg = document.getElementById('img01')
const modalImg2 = document.getElementById('img02')
// const captionText = document.getElementById('caption')
const modalTitle = document.querySelector('#modalTitle')
const modalSub = document.querySelector('#modalSub')
const modalText = document.querySelector('#modalText')
const otherImg = document.querySelectorAll('.otherImg')
const all = [
  {
    picSrc: 'img/graphic01-zoom.png',
    picSrc2: 'img/graphic01-zoom2.png',
    title: '文瀚苑簡銷手冊',
    sub: '2018 築優建設 建案《文瀚苑》簡銷手冊 第一版',
    text: '建案位處神岡區，客群主推中青家庭，因此選用田園閒致為主要的意念。風格走向水墨設計，配合案名「文瀚」，全設計以綠色與暈染元素呼應。簡銷手冊：用於業務推廣，因此以資訊清晰、快速閱讀為優先考量，規劃頁面方式與簡報相，希望讀者可以迅速被建案資訊吸引而希望了解更多。'
  },
  {
    picSrc: 'img/graphic02-zoom.png',
    picSrc2: 'img/graphic02-zoom2.png',
    title: '文瀚苑銷售精裝書',
    sub: '2018 築優建設 建案《文瀚苑》銷售精裝書 第二版',
    text: '設計概念由建案名《文瀚苑》出發，希望傳達「徜徉在文書氣息的浩瀚汪洋中」的初衷，因此以藍色為主色調，提供幽深廣闊的意象，並多處以「綠樹」、「豐富生態」等翠綠元素為輔，更貼近建案位處神岡區的郊區地利，回歸田園氣息所提供的舒心與閒適。'
  },
  {
    picSrc: 'img/graphic03-zoom.png',
    picSrc2: '',
    title: '氣。象 三人聯展 主視覺設計',
    sub: '2015 亞米藝術 謝牧岐/黃柏皓/賴昱成 三人聯展',
    text: '由亞米藝術為三位特色各異的年輕藝術家所舉辦的聯展。較為困難的部分是如何在三位風格不同的藝術家的眾多作品中挑選適合的作品作為聯展的主視覺。與藝廊老闆討論後決定採選色調與性質較接近的作品作為主視覺，並搭配簡約風格設計，讓藝術家的作品保有特色的同時，主視覺能依然和諧並清晰呈現資訊。'
  },
  {
    picSrc: 'img/graphic04-zoom.png',
    picSrc2: '',
    title: 'DM設計',
    sub: '2015-2017 卓越文教 DM設計',
    text: '此系列委託案主要的訴求在於活潑、清爽，因此大多採用高彩度、高對比的設計風格，除了符合業主希望呈現的品牌特色更需因應其用途：傳單展示時機多為路邊發放或是投遞信箱，「吸睛」、「痛點文案」等迅速擄獲受眾注意力的要件便成為設計時的首要考量，因此除了大膽鮮明的色彩，更剔除大量文字與資訊，以淺顯易懂的單一主視覺為出發，從而與傳統補教業偏重多內容多資訊做出區隔性，改觀為讓學生與家長都更能接受的資訊與品牌。'
  },
  {
    picSrc: 'img/graphic05-zoom.png',
    picSrc2: '',
    title: '小林煎餅禮盒設計',
    sub: '2018 築優建設 客製化企業禮盒',
    text: '為了發展企業形象與品牌特色，公司於2018年發展一系列以「築優寶寶」吉祥物的相關周邊與禮贈品。並委託台中知名糕餅廠牌"小林煎餅"製作相關客製化企業禮盒。</br>設計從禮盒外觀、盒型，甚至內部餅乾的烙印圖案、擺放順序與位置皆須包含，並且除了意象設計外，更需要注意紙盒印刷相關細節，如軋印、局部光等呈現質感，頻繁往返印刷廠與公司與不下百次的反覆校對，只為確保每位顧客拿到禮品都是最優質，足以代表公司形象與心意的禮盒。'
  }
]
img.forEach((item, index) => item.addEventListener('click', function () {
  modal.style.display = 'flex'
  modal.style.justifyContent = 'flex-start'
  modal.style.alignItems = 'flex-start'
  modalImg.src = `${all[index].picSrc}`
  if (all[index].picSrc2 !== '') {
    modalImg2.style.display = 'block'
    modalImg2.src = `${all[index].picSrc2}`
  } else {
    modalImg2.style.display = 'none'
  }
  modalTitle.innerHTML = `${all[index].title}`
  modalSub.innerHTML = `${all[index].sub}`
  modalText.innerHTML = `${all[index].text}`
}))

const otherDesign = [
  {
    picSrc: 'img/other01-zoom.png',
    picSrc2: 'img/other01-zoom2.png',
    title: '築優寶寶',
    sub: '築優建設 企業吉祥物',
    text: '為了發展企業形象與品牌特色，公司於2018年發展一系列以「築優寶寶」為吉祥物的相關周邊與禮贈品，如 FaceBook 粉絲專頁形象照與 banner、年節相關祝賀賀卡、貼圖、相關禮贈品等。'
  },
  {
    picSrc: 'img/other02-zoom.png',
    picSrc2: '',
    title: '大型廣告看板',
    sub: '築優建設 路邊大型廣告看板設計',
    text: '大型廣告看板用於宣傳建案，訴求以清晰、明確的資訊為版面設計首要要點。如何在簡潔的版面與有限的文案中，傳達建案營造的形象，同時保有對於用路人的吸引力，精準的視覺意象是最大關鍵。</br>除了大型廣告看板外，也曾經設計、發包過大型背板，如尾牙形象背景，企業背板等。'
  }
]

otherImg.forEach((item, index) => item.addEventListener('click', function () {
  modal.style.display = 'flex'
  modal.style.justifyContent = 'flex-start'
  modal.style.alignItems = 'flex-start'
  modalImg.src = `${otherDesign[index].picSrc}`
  if (otherDesign[index].picSrc2 !== '') {
    modalImg2.style.display = 'block'
    modalImg2.src = `${otherDesign[index].picSrc2}`
  } else {
    modalImg2.style.display = 'none'
  }
  modalTitle.innerHTML = `${otherDesign[index].title}`
  modalSub.innerHTML = `${otherDesign[index].sub}`
  modalText.innerHTML = `${otherDesign[index].text}`
}))

// Get the <span> element that closes the modal
const span = document.getElementsByClassName('close')[0]

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
  modal.style.display = 'none'
}
