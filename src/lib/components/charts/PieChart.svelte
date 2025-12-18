<script>
  import * as d3 from 'd3';

  // Dados esperados: [{ label: 'Futebola', value: 10 }, { label: 'Outros', value: 5 }]
  export let data = [];

  const width = 400;
  const height = 400;
  const radius = Math.min(width, height) / 2;

  // Paleta de cores do D3
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  // Gerador de Fatias (Pie)
  $: pie = d3.pie()
    .value(d => d.value)
    .sort(null); // Mantém a ordem que mandamos (já ordenamos no statsCalculator)

  // Gerador de Caminhos (Arc)
  $: arc = d3.arc()
    .innerRadius(0) // Se colocar > 0 vira um Donut Chart
    .outerRadius(radius - 20);

  // Dados calculados para o desenho
  $: arcs = pie(data);

  let hoveredIndex = null;
</script>

<div class="pie-container">
  <div class="chart">
    <svg {width} {height} viewBox="0 0 {width} {height}">
      <g transform="translate({width / 2}, {height / 2})">
        {#each arcs as slice, i}
          <path
            d={arc(slice)}
            fill={colorScale(slice.data.label)}
            stroke="white"
            stroke-width="2"
            opacity={hoveredIndex !== null && hoveredIndex !== i ? 0.4 : 1}
            on:mouseover={() => hoveredIndex = i}
            on:mouseout={() => hoveredIndex = null}
          >
            <title>{slice.data.label}: {slice.data.value}</title>
          </path>
        {/each}
      </g>
    </svg>
  </div>

  <div class="legend">
    {#each data as d, i}
      <div 
        class="legend-item" 
        class:dimmed={hoveredIndex !== null && hoveredIndex !== i}
        on:mouseenter={() => hoveredIndex = i}
        on:mouseleave={() => hoveredIndex = null}
      >
        <span class="color-box" style="background-color: {colorScale(d.label)}"></span>
        <span class="label">{d.label}</span>
        <span class="value">{d.value}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .pie-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 20px;
  }

  .chart {
    flex: 1;
    min-width: 250px;
    max-width: 400px;
  }

  svg {
    width: 100%;
    height: auto;
  }

  path {
    transition: opacity 0.2s;
    cursor: pointer;
  }

  .legend {
    flex: 1;
    min-width: 200px;
    max-height: 300px;
    overflow-y: auto;
    padding-right: 10px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: opacity 0.2s;
    padding: 4px;
    border-radius: 4px;
  }
  
  .legend-item:hover {
    background-color: #eee;
  }

  .legend-item.dimmed {
    opacity: 0.3;
  }

  .color-box {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 8px;
    flex-shrink: 0;
  }

  .label {
    flex: 1;
    font-weight: 500;
    margin-right: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .value {
    color: #666;
    font-weight: bold;
  }
</style>