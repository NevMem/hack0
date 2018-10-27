import React, { Component } from 'react'
import { render } from 'react-dom'
import App from './Main.js'
import './main.css'

const rootEl = document.getElementById('app')

render(<App/>, rootEl)

if (module.hot) {
    module.hot.accept()
}