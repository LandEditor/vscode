for (let i = 0; i < 9; i++) {
	for (let j; j < i; j++) {
		if (j + i < 3) {
			return i<j;
		}
	}
}
