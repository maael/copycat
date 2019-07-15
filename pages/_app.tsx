import React from 'react';
import App, { Container } from 'next/app';
import Head from 'next/head';
import Normalize from '../components/styling/Normalize';
import Global from '../components/styling/Global';

class Copycat extends App {
  render() {
    const { Component, pageProps } = this.props

    return (
      <Container>
        <Head>
          <title>Copycat</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" type="image/x-icon" href="/static/favicon.ico" />
          <meta name="author" content="Matthew Elphick" />
          <meta name="description" content="A game about trying to copy others" />
          <meta name="theme-color" content="#EE6C4D" />
          <meta name="color-scheme" content="dark light" />
        </Head>
        <Normalize />
        <Global />
        <Component {...pageProps} />
      </Container>
    )
  }
}

export default Copycat