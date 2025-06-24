
function filterCards() {
  const departure = document.getElementById('departure').value.toLowerCase();
  const destination = document.getElementById('destination').value.toLowerCase();
  const tripType = document.getElementById('trip-type').value.toLowerCase();
  const sort = document.getElementById('price-sort').value;

  let cards = Array.from(document.querySelectorAll('.card'));

  cards.forEach(card => {
    const from = card.getAttribute('data-from').toLowerCase();
    const to = card.getAttribute('data-to').toLowerCase();
    const type = card.getAttribute('data-type').toLowerCase();
    const matches = from.includes(departure) && to.includes(destination) && (tripType === "" || type === tripType);
    card.style.display = matches ? 'block' : 'none';
  });

  let visibleCards = cards.filter(card => card.style.display === 'block');
  if (sort === 'price-low') {
    visibleCards.sort((a, b) => a.getAttribute('data-price') - b.getAttribute('data-price'));
  } else if (sort === 'price-high') {
    visibleCards.sort((a, b) => b.getAttribute('data-price') - a.getAttribute('data-price'));
  }

  const container = document.getElementById('card-list');
  visibleCards.forEach(card => container.appendChild(card));
}
