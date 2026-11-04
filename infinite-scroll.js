// Infinite-scroll helper: one IntersectionObserver watches the
// sentinel element the InfiniteScroll component renders at the end of
// a list. When the sentinel comes within 800px of the viewport, the
// component is told to load the next page. isNearBottom lets the
// component keep loading after a render while the sentinel is still
// in range (short pages that never trigger a scroll).
let observer = null;
let currentRef = null;

export function observe(element, dotNetRef) {
    disconnect();
    currentRef = dotNetRef;
    observer = new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) {
            currentRef?.invokeMethodAsync('NotifyNearBottom');
        }
    }, { rootMargin: '800px' });
    observer.observe(element);
}

export function disconnect() {
    observer?.disconnect();
    observer = null;
    currentRef = null;
}

export function isNearBottom(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight + 800;
}
