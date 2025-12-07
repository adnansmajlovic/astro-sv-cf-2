<script>
    let count = $state(0);

    function increment() {
        count++;
    }
</script>

<button
    onclick={increment}
    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
>
    Clicks: {count}
</button>
