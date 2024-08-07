import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'

import { useGsi } from './GsiContext'

const GrafoItinerario = ({ numItinerario }) => {
  const svgRef = useRef(null)
  const { gsiData } = useGsi()

  const lineasDesniveles = gsiData.itinerarios.filter(
    (itinerario) => itinerario.numItinerario === numItinerario
  )[0].tabla_desniveles

  useEffect(() => {
    const width = 800
    const height = 600

    let puntoEspaldaActual = null
    let numEstacionamiento = 0

    const links = lineasDesniveles.reduce((acc, lineaDesnivel) => {
      if (
        !puntoEspaldaActual ||
        lineaDesnivel.punto_espalda !== puntoEspaldaActual
      ) {
        puntoEspaldaActual = lineaDesnivel.punto_espalda
        numEstacionamiento += 1
      }
      acc.push({
        source: `EST-${numEstacionamiento}`,
        target: lineaDesnivel.punto_espalda,
        distance: lineaDesnivel.distancia_espalda,
        group: numEstacionamiento,
      })
      acc.push({
        source: `EST-${numEstacionamiento}`,
        target: lineaDesnivel.punto_frente,
        distance: lineaDesnivel.distancia_frente,
        group: numEstacionamiento,
      })
      return acc
    }, [])

    const setNodes = Array.from(
      new Set(links.flatMap((obj) => [obj.source, obj.target]))
    )
    const nodes = setNodes.map((id) => ({ id }))

    const maxDistance = Math.max(...links.map((link) => link.distance))

    const scale = d3
      .scaleLinear()
      .domain([0, maxDistance])
      .range([0, Math.min(width, height) * 0.05])

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('viewBox', `0 0 ${width} ${height}`)

    const g = svg.append('g')

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((d) => scale(d.distance))
      )
      .force('charge', d3.forceManyBody().strength(-5))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(20))

    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)

    const node = g
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d) => (d.id.startsWith('EST') ? 8 : 3))
      .attr('fill', (d) => (d.id.startsWith('EST') ? '#ff0000' : '#00ff00'))

    node.append('title').text((d) => d.id)

    const labels = g
      .append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text((d) => d.id)
      .attr('font-size', '10px')
      .attr('dx', 8)
      .attr('dy', 3)
      .attr('fill', '#fff')

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)

      node.attr('cx', (d) => d.x).attr('cy', (d) => d.y)

      labels.attr('x', (d) => d.x).attr('y', (d) => d.y)
    })

    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom).call(zoom.transform, d3.zoomIdentity)

    simulation.on('end', () => {
      svg.call(zoom)
    })
  }, [lineasDesniveles])

  return (
    <div className="card card-body p-0 mb-3" style={{ height: '600px' }}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
    </div>
  )
}

export default GrafoItinerario
