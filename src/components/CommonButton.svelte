<script>
    import '../styles/fonts.css';
    import '../styles/constants.css';
    import '../styles/interactive-elements.css';
    
    let {
        text = '',
        fillMode = 'filled', // 'filled' или 'bordered'
        colorMode = 'dark', // 'light' или 'dark'
        cssClass = '',
        disabled = false,
        onTap = () => {},
        ...restProps
    } = $props();
    
    let isPressed = $state(false);
    let buttonClasses = $state('');
    let buttonStyle = $state({});
    
    $effect(() => {
        buttonClasses = `common-button ${fillMode} ${colorMode} ${isPressed ? 'pressed' : ''} ${disabled ? 'disabled' : ''} ${cssClass}`;
        
        const style = {};
        
        if (fillMode === 'filled') {
            style.backgroundColor = colorMode === 'dark' ? 'var(--accent)' : 'var(--bg)';
            style.color = colorMode === 'dark' ? 'var(--txt-white)' : 'var(--txt-primary)';
            style.border = 'none';
        } else { // bordered
            style.backgroundColor = 'transparent';
            style.color = colorMode === 'dark' ? 'var(--accent)' : 'var(--bg)';
            style.border = `1px solid ${colorMode === 'dark' ? 'var(--accent)' : 'var(--bg)'}`;
        }
        
        if (disabled) {
            style.opacity = '0.5';
            style.cursor = 'not-allowed';
        }
        
        buttonStyle = style;
    });
    
    function handlePointerDown(e) {
        e.preventDefault();
        if (disabled) {
            return;
        }
        isPressed = true;
    }
    
    function handlePointerUp(e) {
        e.preventDefault();

        if (!isPressed || disabled) {
            return;
        }
        
        const isStillOverButton = e.target === e.currentTarget || e.currentTarget.contains(e.target);
        
        isPressed = false;
        
        if (isStillOverButton) {
            const tapEvent = new CustomEvent('tap', {
                detail: { originalEvent: e },
                bubbles: true,
                cancelable: true
            });
            
            onTap(tapEvent);            
            e.currentTarget.dispatchEvent(tapEvent);
        }
    }
    
    function handlePointerLeave() {
        isPressed = false;
    }
    
    function handleClick(e) {
        e.preventDefault();

        if (disabled) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        
        requestAnimationFrame(() => {
            const tapEvent = new CustomEvent('tap', {
                detail: { originalEvent: e },
                bubbles: true,
                cancelable: true
            });
            onTap(tapEvent);
            e.currentTarget.dispatchEvent(tapEvent);
        });
    }
</script>

<style>
    .common-button {
        height: 51px;
        min-height: 51px;
        padding: 16px 0;
        border-radius: 25px;
        font-family: 'Inter', sans-serif;
        font-size: 16px;
        font-weight: 500;
        line-height: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        transform-origin: center;
        outline: none;
        -webkit-tap-highlight-color: transparent;
        border: 1px solid transparent;
        box-sizing: border-box;
        touch-action: manipulation;
        margin: 0;
        text-decoration: none;
    }
    
    .common-button.pressed:not(.disabled) {
        transform: scale(0.96);
        opacity: 0.85 !important;
    }
    
    @media (hover: hover) and (pointer: fine) {
        .common-button:hover:not(.disabled) {
            opacity: 0.9;
            transform: translateY(-1px);
        }
    }
    
    .common-button.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
        pointer-events: none;
    }
    
    .common-button.filled.dark {
        background-color: var(--accent);
        color: var(--txt-white);
        border: none;
    }
    
    .common-button.filled.light {
        background-color: var(--bg);
        color: var(--txt-primary);
        border: none;
    }
    
    .common-button.bordered.dark {
        background-color: transparent;
        color: var(--accent);
        border: 1px solid var(--accent);
    }
    
    .common-button.bordered.light {
        background-color: transparent;
        color: var(--bg);
        border: 1px solid var(--bg);
    }
</style>

<button
    class={buttonClasses}
    style={buttonStyle}    
    onpointerdown={handlePointerDown}
    onpointerup={handlePointerUp}
    onpointerleave={handlePointerLeave}
    onpointercancel={handlePointerLeave}    
    ontouchstart={handlePointerDown}
    ontouchend={handlePointerUp}
    ontouchcancel={handlePointerLeave}    
    onclick={handleClick}    
    disabled={disabled}    
    {...restProps}    
    aria-pressed={isPressed}
>
    {text}
</button>