<script>
    import { page } from "$app/stores";
    import { base } from "$app/paths";

    let pages = [
        { url: "/", title: "Home" },
        { url: "/results", title: "Results" },
        { url: "/howto", title: "How to Use it" },
        {url: "https://github.com/jgabrielsg/reddit_retrospective", title:"GitHub"}
    ];

    let localStorage = globalThis.localStorage ?? {};
    let root = globalThis?.document?.documentElement;
</script>

<nav>
    {#each pages as p}
        <a
            href={p.url.startsWith("http") 
                ? p.url: `${base}${p.url}`}
            class:current={$page.route.id === p.url}
            target={p.url.startsWith("http") ? "_blank" : undefined}
        >
            {p.title}
        </a>
    {/each}
</nav>  

<slot />

<style>
    nav {
        --border-color: oklch(50% 10% 200 / 40%);
        
        display: flex;
        margin-bottom: 1em;
        border-bottom-width:1px;
        border-bottom-style:solid;
        
        border-bottom-color: var(--border-color);
		max-width: 1024px;
    }

    nav a {
        flex:1;
        text-decoration: none;
        color: inherit;
        text-align: center; 
        padding: 0.5em;
    }

    nav a.current {
        border-bottom-width:0.4em;
        border-bottom-style:solid;
        border-bottom-color: var(--border-color);
        padding-bottom:0.1em;
        font-weight: bold;
    }

    nav a:hover {
        border-bottom-width:0.4em;
        border-bottom-style:solid;
        border-bottom-color:var(--color-accent);
        padding-bottom:0.1em;
        background-color: color-mix(in oklch, var(--color-accent), canvas 85%);
    }
</style>