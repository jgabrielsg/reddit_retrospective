<script>
  import * as d3 from 'd3';

  // Recebe os dados já processados: [{ label: 'Jan', value: 10 }, ...]
  export let data = [];
  export let color = "#FF4500"; // Cor padrão Reddit

  // Dimensões
  const width = 600;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };

  // D3 Scales (Matemática)
  // Eixo X (Categorias: Jan, Fev...)
  $: xScale = d3.scaleBand()
    .domain(data.map(d => d.label))
    .range([margin.left, width - margin.right])
    .padding(0.3);

  // Eixo Y (Valores: 0 a Max)
  $: yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value) || 10]) // O "|| 10" evita crash se tudo for 0
    .range([height - margin.bottom, margin.top]);

  // Função auxiliar para tooltips simples
  let hoveredData = null;
</script>

<div class="chart-container">
  <svg {width} {height} viewBox="0 0 {width} {height}">
    
    <g transform="translate(0, {height - margin.bottom})">
      {#each data as d}
        <text
          x={xScale(d.label) + xScale.bandwidth() / 2}
          y={20}
          text-anchor="middle"
          font-size="12"
          fill="#555"
        >
          {d.label}
        </text>
      {/each}
      <line x1={margin.left} x2={width - margin.right} stroke="#ccc" />
    </g>

    {#each data as d}
      <rect
        x={xScale(d.label)}
        y={yScale(d.value)}
        width={xScale.bandwidth()}
        height={yScale(0) - yScale(d.value)}
        fill={color}
        rx="4" 
        opacity={hoveredData && hoveredData !== d ? 0.5 : 1}
        on:mouseover={() => hoveredData = d}
        on:mouseout={() => hoveredData = null}
      >
        <title>{d.label}: {d.value}</title> </rect>

      {#if d.value > 0}
        <text
          x={xScale(d.label) + xScale.bandwidth() / 2}
          y={yScale(d.value) - 5}
          text-anchor="middle"
          font-size="10"
          fill="#333"
          font-weight="bold"
        >
          {d.value}
        </text>
      {/if}
    {/each}
  </svg>
</div>

<style>
  .chart-container {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }
  svg {
    width: 100%;
    height: auto;
    overflow: visible;
  }
  rect {
    transition: all 0.2s;
    cursor: pointer;
  }
</style>