# NestApp

The online platform for Nest algorithm.

![screen of working](./samples/web_screen.png)

## How to use?

#### [Visit Nest2D](https://nest2d.online/)

# What is Nest Problem?

Given a square piece of material and some letters to be laser-cut:

We want to pack all the letters into the square, using as little material as possible. If a single square is not enough,
we also want to minimize the number of squares used.

In the CNC world this is called "nesting", and software that does this is typically targeted at industrial customers and very expensive. for more detail , please go to [SVGNest](https://github.com/Jack000/SVGnest)

## Current development status

Curretly, the projest in refactoring stage. The project originaly based on Nest4J fork. I aleardy migarte the nesting algorithm to the Rust library by [JeroenGar](https://github.com/JeroenGar).

I want to make change in the project quickly. So I decide to remove the Java backend and use the Nuxt for both backend and frontend. In case your interested in the java backend source code, you can find it [Release 0.5.4 last release with java backend](https://github.com/VovaStelmashchuk/nest2d/releases/tag/0.5.4)

## The repository based on few github project, I keep the original history of commits.

Also, i have some plane to modify the project. The project will be support DXF file. The SVG format available only for
the preview. The project will be migrate to Kotlin fully or majority.

Fill free to create issues or pull requests. The main goal of the project is mainly free and open source solution for
nesting problem. I try to find the way to compensate the price of cloud server. **You Star of the project can help to
apply to some open source program.**

### Big Thanks to [JeroenGar](https://github.com/JeroenGar)

He is the author of [jagua-rs](https://github.com/JeroenGar/jagua-rs). I use his project as the core service for the
service. Without his project, I can't make this project.

I use slightly modified version of his project. Can be found [here](https://github.com/VovaStelmashchuk/jagua-rs)

### Credits:

- [SVGNest](https://github.com/Jack000/SVGnest)
- [DXFReader](https://github.com/wholder/DXFReader)
- [NEST4J fork](https://github.com/micycle1/Nest4J/tree/master)
- [Dexus](https://github.com/Dexus)
- [Deepnest](https://github.com/deepnest-next)

Also special thanks to:

- [Autocad dxf](https://github.com/Asaye/autocad-dxf/tree/main)

## Development setup

Make sure to install dependencies:

```bash
# npm
npm install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build
```

Locally preview production build:

```bash
# npm
npm run preview
```

### Referenced Paper

- [López-Camacho _et al._ 2013](http://www.cs.stir.ac.uk/~goc/papers/EffectiveHueristic2DAOR2013.pdf)
- [Kendall 2000](http://www.graham-kendall.com/papers/k2001.pdf)
- [E.K. Burke _et al._ 2006](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.440.379&rep=rep1&type=pdf)
