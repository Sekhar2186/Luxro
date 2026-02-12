import React from 'react'
import {Hero} from '../components/Hero/Hero'
import {Popular} from '../components/Popular/Popular'
import {Offers} from '../components/Offers/Offers'
import { NewCollection } from '../components/NewCollections/NewCollections'
import { NewsLetter } from '../components/NewsLetter/NewsLetter'
import {PopularWomen} from '../components/PopularWomen/PopularWomen'
export const Shop = () => {
  return (
    <div>
        <Hero/>
        <Popular/>
        <PopularWomen/>
        <Offers/>
        <NewCollection/>
        <NewsLetter/>
    </div>
  )
}
