<script>
    import '../styles/app.css';
    import '../styles/constants.css';
    import '../styles/interactive-elements.css';

    let {
        cssClass = '',
        isMuted = false,
        onTap = (isMuted) => {}
    } = $props();

    let isPressed = $state(false);
    let localIsMuted = $state(isMuted);

    function handleTap(e) {
        localIsMuted = !localIsMuted;
        onTap(localIsMuted);
    }

    function handlePointerDown(e) {
        isPressed = true;
    }

    function handlePointerUp(e) {
        e.preventDefault();

        if (!isPressed) {
            return;
        }
        
        const isStillOverButton = e.target === e.currentTarget || e.currentTarget.contains(e.target);
        
        isPressed = false;
        
        if (isStillOverButton) {
            handleTap(e);
        }
    }

    function handlePointerLeave() {
        isPressed = false;
    }

    function handleClick(e) {
        e.preventDefault();
        requestAnimationFrame(() => handleTap(e));
    }
</script>

<button
    class="sound-btn {cssClass}"
    type="button"
    onpointerdown={handlePointerDown}
    onpointerup={handlePointerUp}
    onpointerleave={handlePointerLeave}
    onpointercancel={handlePointerLeave}    
    ontouchstart={handlePointerDown}
    ontouchend={handlePointerUp}
    ontouchcancel={handlePointerLeave}    
    onclick={handleClick}    
    aria-pressed={isPressed}
    aria-label="Звук"
>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M11 5L6.5 9H3v6h3.5L11 19V5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M16 9c1.5 1.5 1.5 4.5 0 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M18.5 6.5c3 3 3 8 0 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        {#if localIsMuted}
            <line x1="5" y1="19" x2="19" y2="5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        {/if} 
    </svg>
</button>