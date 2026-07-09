/* Project 50 — shared behaviour */
(function () {
  'use strict'

  var motionOK = window.matchMedia('(prefers-reduced-motion: no-preference)').matches

  /* ---- Nav scroll state ---- */
  var nav = document.querySelector('.nav')
  if (nav && !nav.classList.contains('nav--solid')) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 80) }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
  }

  /* ---- Mobile menu: dialog semantics + focus trap ---- */
  var toggle = document.querySelector('.nav__toggle')
  var menu = document.getElementById('menu')
  if (toggle && menu) {
    var focusables = function () {
      return menu.querySelectorAll('a[href], button:not([disabled])')
    }
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open))
      menu.classList.toggle('open', open)
      document.body.style.overflow = open ? 'hidden' : ''
      if (open) {
        var f = focusables()
        if (f.length) f[0].focus()
      } else {
        toggle.focus()
      }
    }
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true')
    })
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { setOpen(false); return }
      if (e.key !== 'Tab') return
      var f = focusables()
      if (!f.length) return
      var first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    })
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false) })
    })
  }

  /* ---- FAQ accordion ---- */
  var faqButtons = document.querySelectorAll('.faq__q')
  faqButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq__item')
      var wasOpen = item.classList.contains('open')
      document.querySelectorAll('.faq__item.open').forEach(function (i) {
        i.classList.remove('open')
        i.querySelector('.faq__q').setAttribute('aria-expanded', 'false')
      })
      if (!wasOpen) {
        item.classList.add('open')
        btn.setAttribute('aria-expanded', 'true')
      }
    })
  })

  /* ---- Scroll reveals (motion-safe: hidden state only added when animating) ---- */
  if (motionOK && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('anim')
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-inview')
          io.unobserve(entry.target)
        }
      })
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' })
    document.querySelectorAll('.reveal, .horizon, .tape-rule').forEach(function (el) { io.observe(el) })
  }

  /* ---- Web3Forms submit (contact + newsletter) ---- */
  var wireForm = function (form, onSuccess, onError) {
    form.addEventListener('submit', function (e) {
      e.preventDefault()
      if (!form.reportValidity()) return
      var btn = form.querySelector('button[type="submit"]')
      var label = btn ? btn.textContent : ''
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…' }
      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      }).then(function (r) { return r.json() }).then(function (data) {
        if (data.success) { onSuccess() } else { throw new Error(data.message || 'failed') }
      }).catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = label }
        onError()
      })
    })
  }

  var params = new URLSearchParams(location.search)

  var cf = document.getElementById('cf')
  var fs = document.getElementById('fs')
  var fe = document.getElementById('fe')
  if (cf && fs) {
    var showSent = function () { cf.hidden = true; fs.hidden = false; if (fe) fe.hidden = true }
    wireForm(cf, function () {
      showSent()
      if (window.posthog) window.posthog.capture('contact_form_submitted')
    }, function () { if (fe) fe.hidden = false })
    if (params.get('sent') === '1') showSent()
  }

  var nf = document.getElementById('nf')
  var ns = document.getElementById('ns')
  var ne = document.getElementById('ne')
  if (nf && ns) {
    var showSubscribed = function () { nf.hidden = true; ns.hidden = false; if (ne) ne.hidden = true }
    wireForm(nf, function () {
      showSubscribed()
      if (window.posthog) window.posthog.capture('newsletter_subscribed')
    }, function () { if (ne) ne.hidden = false })
    if (params.get('nl') === '1') showSubscribed()
  }
})()
