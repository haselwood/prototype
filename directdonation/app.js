(function () {
    function parseLocalDate(iso) {
        if (!iso || typeof iso !== 'string') return null;
        const parts = iso.split('-');
        if (parts.length !== 3) return null;
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
        return new Date(y, m - 1, d);
    }
    function todayLocal() {
        const t = new Date();
        return new Date(t.getFullYear(), t.getMonth(), t.getDate());
    }
    const views = {
        start: document.getElementById('view-start'),
        oneTime: document.getElementById('view-oneTime'),
        oneTimeFunding: document.getElementById('view-oneTimeFunding'),
        recurring: document.getElementById('view-recurring'),
        oneTimeConfirm: document.getElementById('view-oneTimeConfirm'),
        oneTimePledgeConfirm: document.getElementById('view-oneTimePledgeConfirm'),
        confirmation: document.getElementById('view-confirmation'),
    };

    const header = document.getElementById('siteHeader');
    const headerTitle = document.getElementById('headerTitle');
    const progress = {
        container: document.getElementById('progressContainer'),
        fill: document.getElementById('progressFill'),
    };
    const leftCol = document.getElementById('leftCol');
    const rightAside = document.getElementById('rightAside');

    // Position and toggle the left floating match card independently of the receipt panel
    function positionLeftMatchCard() {
        const leftAside = document.getElementById('leftMatchAside');
        const leftCard = document.getElementById('leftMatchCard');
        if (!leftAside || !leftCard) return;
        const headerHeight = header ? header.offsetHeight : 0;
        const shouldShow = (state.view === 'oneTime' || state.view === 'recurring') && window.innerWidth >= 1024;
        if (shouldShow) {
            leftAside.classList.remove('hidden');
            leftAside.style.position = 'fixed';
            leftAside.style.top = headerHeight + 24 + 'px';
            leftAside.style.left = '40px';
        } else {
            leftAside.classList.add('hidden');
        }
    }

	const summary = {
        card: document.getElementById('summaryCard'),
        headlineTotal: document.getElementById('sumHeadlineTotal'),
        itemization: document.getElementById('creditsItemization'),
        creditsNote: document.getElementById('creditsNote'),
        covered: document.getElementById('sumCovered'),
        due: document.getElementById('sumDue'),
        total: document.getElementById('sumTotal'),
	};

	const buttons = {
		checkout: document.getElementById('checkoutBtn'),
		startDonate: document.getElementById('startDonateBtn'),
		startDonateNoCredits: document.getElementById('startDonateNoCreditsBtn'),
		startDonateNpoIneligible: document.getElementById('startDonateNpoIneligibleBtn'),
		backToDonation: document.getElementById('backToDonationBtn'),
		chooseBack: document.getElementById('chooseBackBtn'),
		chooseContinue: document.getElementById('chooseContinueBtn'),
		oneTimeBack: document.getElementById('oneTimeBackBtn'),
		oneTimeContinue: document.getElementById('oneTimeContinueBtn'),
		recurringBack: document.getElementById('recurringBackBtn'),
		recurringContinue: document.getElementById('recurringContinueBtn'),
		confirmDone: document.getElementById('confirmDoneBtn'),
	};

	const inputs = {
		amountChips: document.getElementById('amountChips'),
		customAmount: document.getElementById('customAmount'),
		amountError: document.getElementById('amountError'),
		otAmountChips: document.getElementById('otAmountChips'),
		otCustomAmount: document.getElementById('otCustomAmount'),
		otAmountError: document.getElementById('otAmountError'),
		creditRows: () => Array.from(document.querySelectorAll('#creditsList .credit-row')),
		userCoversFee: document.getElementById('userCoversFee'),
        monthlyDay: document.getElementById('monthlyDay'),
        monthlyDayDate: document.getElementById('monthlyDayDate'),
		weeklyInterval: document.getElementById('weeklyInterval'),
		weeklyStart: document.getElementById('weeklyStart'),
        recurringStart: document.getElementById('recurringStart'),
        recurringEnd: document.getElementById('recurringEnd'),
        recurrencePreset: document.getElementById('recurrencePreset'),
        customWeeklyInterval: document.getElementById('customWeeklyInterval'),
        endSelect: document.getElementById('endSelect'),
        endHelp: document.getElementById('endHelp'),
	};

	const confirmEls = {
		amount: document.getElementById('confirmAmount'),
		cadence: document.getElementById('confirmCadence'),
		fee: document.getElementById('confirmFee'),
		total: document.getElementById('confirmTotal'),
	};

    const reviewEls = {
        title: document.getElementById('reviewTitle'),
        list: document.getElementById('reviewList'),
        total: document.getElementById('reviewTotal'),
        txnCount: document.getElementById('reviewTxnCount'),
        totalOrg: document.getElementById('reviewTotalOrg'),
        note: document.getElementById('npoNote'),
        anonymous: document.getElementById('npoAnonymous'),
        donateSubmit: document.getElementById('donateSubmit'),
    };
    const pledgeConfirmEls = {
        title: document.getElementById('pledgeReviewTitle'),
        list: document.getElementById('pledgeReviewList'),
        total: document.getElementById('pledgeReviewTotal'),
        txn: document.getElementById('pledgeReviewTxnCount'),
        payMethod: document.getElementById('pledgePayMethod'),
        note: document.getElementById('pledgeNote'),
        anonymous: document.getElementById('pledgeAnonymous'),
        due: document.getElementById('pledgeDue'),
        donateBtn: document.getElementById('pledgeDonateBtn'),
    };
    const fundingEls = {
        amountLabel: document.getElementById('fundingAmountLabel'),
        balance: document.getElementById('fundingBalance'),
        feeFixed: document.getElementById('fundingFeeFixed'),
        feeCardRow: document.getElementById('fundingFeeCardRow'),
        feeCard: document.getElementById('fundingFeeCard'),
        total: document.getElementById('fundingTotal'),
        goingRow: document.getElementById('fundingGoingRow'),
        goingAmount: document.getElementById('fundingGoingAmount'),
        youPay: document.getElementById('fundingYouPay'),
        charity: document.getElementById('fundingCharity'),
        donationRow: document.getElementById('fundingDonation'),
        coverFee: document.getElementById('coverFeeFunding'),
        gsaError: document.getElementById('gsaError'),
        gsaBalanceLabel: document.getElementById('gsaBalanceLabel'),
    };
    const successEls = {
        overlay: document.getElementById('donateSuccess'),
        charged: document.getElementById('donateCharged'),
        impact: document.getElementById('donateImpact'),
        txnText: document.getElementById('donateTxnText'),
        close: document.getElementById('donateCloseBtn'),
    };
    // Prepare confetti canvas (initialize when modal opens so size isn't 0x0)
    const confettiCanvas = document.getElementById('donateConfetti');
    let fireConfetti = null;
    let isSuccessOpen = false;
    function ensureConfettiReady() {
        if (!window.confetti || !confettiCanvas) return null;
        const overlayEl = document.getElementById('donateSuccess');
        let w = overlayEl ? overlayEl.clientWidth : 0;
        let h = overlayEl ? overlayEl.clientHeight : 0;
        if (!w || !h) { w = window.innerWidth; h = window.innerHeight; }
        confettiCanvas.width = w;
        confettiCanvas.height = h;
        fireConfetti = window.confetti.create(confettiCanvas, { resize: false, useWorker: true });
        return fireConfetti;
    }

    const state = {
		view: 'start',
		donationType: null, // 'oneTime' | 'recurring'
		amount: 0,
		otCreditsApplied: 0,
		userCoversFee: false,
        hasCredits: true,
		isNpoEligible: true,
		cadence: null, // 'monthly' | 'weekly' | 'semiMonthly'
		monthlyDay: null,
		weeklyInterval: 1,
		weeklyStart: null,
        recurringStart: null,
        endType: 'none', // 'none' | 'untilMatch' | 'onDate'
        recurringEnd: null,
		employerCoversFee: false,
        matchEdited: false,
        note: '',
        anonymous: false,
        fundingMethod: 'bankSaved', // 'bankSaved' | 'bankAdd' | 'gsa' | 'card'
        gsaBalance: 100,
        cardInfoAdded: false,
        program: {
            name: 'CBC Capital',
            capTotal: 1000,
            usedToDate: 550,
            multiplier: 1,
            expiresAt: '2025-12-31',
        },
        matchPerInstallment: 0,
	};
    let isChooseOpen = false;
    let isInitialRendered = false;
    let chooseLockOneTime = false;

    function resetAllState() {
        state.donationType = null;
        state.amount = 0;
        state.otCreditsApplied = 0;
        state.userCoversFee = false;
        state.hasCredits = true;
        state.isNpoEligible = true;
        state.cadence = null;
        state.monthlyDay = null;
        state.weeklyInterval = 1;
        state.weeklyStart = null;
        state.recurringStart = null;
        state.endType = 'none';
        state.recurringEnd = null;
        state.employerCoversFee = false;
        state.matchEdited = false;
        state.note = '';
        state.anonymous = false;
        state.fundingMethod = 'bankSaved';
        state.cardInfoAdded = false;
        state.matchPerInstallment = 0;
        // Clear common inputs visually where reasonable
        if (inputs.customAmount) inputs.customAmount.value = '';
        const chips = inputs.amountChips ? inputs.amountChips.querySelectorAll('.chip') : [];
        chips && chips.forEach((el) => el.classList && el.classList.remove('active'));
        if (inputs.otCustomAmount) inputs.otCustomAmount.value = '';
        const oChips = inputs.otAmountChips ? inputs.otAmountChips.querySelectorAll('.chip') : [];
        oChips && oChips.forEach((el) => el.classList && el.classList.remove('active'));
    }

    function updateHeaderForView() {
        if (!header) return;
        // Title
        if (headerTitle) {
            let title = 'Make a one-time donation';
            if (state.view === 'recurring') title = 'Set up a recurring donation';
            if (state.view === 'oneTime' || state.view === 'oneTimeConfirm') title = 'Make a one-time donation';
            if (state.view === 'oneTimeFunding' && state.donationType === 'recurring') title = 'Set up a recurring donation';
            if (state.view === 'oneTimePledgeConfirm' && state.donationType === 'recurring') title = 'Set up a recurring donation';
            if (state.view === 'confirmation' && state.donationType === 'recurring') title = 'Set up a recurring donation';
            headerTitle.textContent = title;
        }
        // Back button logic
        if (buttons.backToDonation) {
            const showBack = (state.view === 'oneTimeConfirm' || state.view === 'oneTimeFunding' || state.view === 'oneTimePledgeConfirm');
            buttons.backToDonation.classList.toggle('hidden', !showBack);
            if (showBack) {
                let label = 'Back';
                if (state.view === 'oneTimeConfirm') label = 'Back to donation';
                else if (state.view === 'oneTimePledgeConfirm') label = 'Back to funding source';
                else if (state.view === 'oneTimeFunding') label = (state.donationType === 'recurring' ? 'Back to pledge' : 'Back to donation');
                const labelSpan = document.getElementById('backToDonationLabel');
                if (labelSpan) labelSpan.textContent = label;
            }
        }
        // Header checkout visibility/label
        if (buttons.checkout) {
            // Hide header checkout on all screens per updated UX
            const shouldShow = false;
            buttons.checkout.classList.toggle('hidden', !shouldShow);
            // Label per view
            buttons.checkout.querySelector && (() => {
                const span = buttons.checkout.querySelector('span');
                if (span) span.textContent = 'Review and confirm';
            })();
            buttons.checkout.disabled = false;
        }
    }

    function show(view) {
		Object.values(views).forEach((el) => el.classList.add('hidden'));
		views[view].classList.remove('hidden');
		state.view = view;
		updateHeaderCta();
        // Hide header on start screen or when modal is open
        if (header) header.classList.toggle('hidden', view === 'start' || isChooseOpen);
        updateHeaderForView();
        // If navigating back to start after initial render, clear all state
        if (view === 'start' && isInitialRendered) {
            resetAllState();
        }
        // Keep main content centered always; toggle the floating receipt panel separately
        if (rightAside) {
            if (view === 'start') {
                rightAside.classList.add('hidden');
                // defensively ensure any fixed overlays are closed so they don't block clicks
                const choose = document.getElementById('view-choose');
                if (choose) { choose.classList.add('hidden'); choose.classList.remove('flex'); isChooseOpen = false; }
                const success = document.getElementById('donateSuccess');
                if (success) { success.classList.add('hidden'); success.classList.remove('flex'); }
            } else if (view === 'oneTime') {
                rightAside.classList.remove('hidden');
            } else if (view === 'oneTimeConfirm' || view === 'oneTimeFunding') {
                rightAside.classList.add('hidden');
                rightAside.style.display = 'none';
            }
        }
        // Ensure match card is shown on one-time and recurring screens from the start
        positionLeftMatchCard();
        // Funding-specific visibility fixes
        if (view === 'oneTimeFunding') {
            if (header) header.classList.remove('hidden');
            if (rightAside) { rightAside.classList.add('hidden'); rightAside.style.display = 'none'; }
            if (summary.card) { summary.card.classList.add('hidden'); summary.card.style.display = 'none'; }
        } else {
            if (rightAside) rightAside.style.display = '';
            if (summary.card) summary.card.style.display = '';
        }
        updateProgressBar();
	}

    function openChooseModal() {
        const overlay = document.getElementById('view-choose');
        if (!overlay) return;
        isChooseOpen = true;
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        if (header) header.classList.add('hidden');
        // ensure progress is hidden while choosing
        if (progress.container) progress.container.classList.add('hidden');
        // reset selection on open as well
        state.donationType = null;
        if (buttons.chooseContinue) buttons.chooseContinue.disabled = true;
        Array.from(document.querySelectorAll('#view-choose .select-card')).forEach((c) => c.classList.remove('selected'));
        // Toggle "Use donation credits" badge based on hasCredits
        const creditsBadge = document.getElementById('badgeUseCredits');
        if (creditsBadge) creditsBadge.classList.toggle('hidden', !state.hasCredits);
        // If locked to one-time (credits entry), preselect and disable recurring
        if (chooseLockOneTime) {
            const oneTimeCard = document.querySelector('#view-choose .select-card[data-type="oneTime"]');
            const recurringCard = document.querySelector('#view-choose .select-card[data-type="recurring"]');
            if (oneTimeCard) {
                oneTimeCard.classList.add('selected');
                state.donationType = 'oneTime';
                if (buttons.chooseContinue) buttons.chooseContinue.disabled = false;
            }
            if (recurringCard) {
                recurringCard.classList.add('pointer-events-none','opacity-60');
                recurringCard.setAttribute('aria-disabled','true');
            }
        }
    }

    function closeChooseModal() {
        const overlay = document.getElementById('view-choose');
        if (!overlay) return;
        isChooseOpen = false;
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
        if (header) header.classList.toggle('hidden', state.view === 'start');
        // refresh progress visibility after closing modal
        updateProgressBar();
        // reset selection when closing
        state.donationType = null;
        buttons.chooseContinue.disabled = true;
        Array.from(document.querySelectorAll('#view-choose .select-card')).forEach((c) => c.classList.remove('selected'));
        // Re-enable if locked
        const recurringCard = document.querySelector('#view-choose .select-card[data-type="recurring"]');
        if (recurringCard) {
            recurringCard.classList.remove('pointer-events-none','opacity-60');
            recurringCard.removeAttribute('aria-disabled');
        }
        chooseLockOneTime = false;
    }

    function updateHeaderCta() {
        let enabled = false;
        if (state.view === 'recurring') enabled = canProceedRecurring();
        if (state.view === 'oneTime') enabled = canProceedOneTime();
        if (buttons.checkout) buttons.checkout.disabled = !enabled;
    }

    function setProgress(pct) {
        if (!progress.fill) return;
        const clamped = Math.max(0, Math.min(100, Math.round(pct)));
        progress.fill.style.width = clamped + '%';
        progress.fill.setAttribute('aria-valuenow', String(clamped));
    }

    function updateProgressBar() {
        if (!progress.container) return;
        const shouldShow = (state.view === 'oneTime' || state.view === 'oneTimeConfirm' || state.view === 'oneTimeFunding' || state.view === 'recurring' || (state.view === 'confirmation' && state.donationType === 'recurring')) && !isChooseOpen;
        progress.container.classList.toggle('hidden', !shouldShow);
        if (!shouldShow) return;
        // Credits-confirmation screen is always complete
        if (state.view === 'oneTimeConfirm') {
            setProgress(100);
            return;
        }
        if (state.view === 'recurring') { setProgress(50); return; }
        if (state.view === 'oneTimeFunding') {
            setProgress(75);
            return;
        }
        // One-time screen always shows 50%, regardless of selections
        setProgress(50);
    }

	function toDollar(n) {
		return `$${(n || 0).toFixed(2)}`;
	}

    function toDollarWholeCeil(n) {
        const v = Math.ceil(n || 0);
        return `$${v.toLocaleString()}`;
    }

	function feeFor(amount) {
		if (state.view === 'recurring') {
			if (state.employerCoversFee) return 0;
			return amount * 0.029 + 0.3;
		}
		// one-time
		if (!state.userCoversFee) return 0;
		return amount * 0.029 + 0.3;
	}

    function recomputeSummary() {
        // keep progress in sync with pledge presence
        updateProgressBar();
        // Determine visibility of summary
        const hasSelection = (state.view === 'oneTime' && ((state.otCreditsApplied || 0) > 0 || (state.amount || 0) > 0))
            || (state.view === 'recurring' && (state.amount || 0) > 0);
        const showPanel = (state.view !== 'oneTimeFunding') && (hasSelection || state.view === 'confirmation');
        if (showPanel) {
            rightAside && rightAside.classList.remove('hidden');
            summary.card.classList.remove('hidden');
            const contentRect = document.querySelector('#centerContent')?.getBoundingClientRect();
            const headerHeight = header ? header.offsetHeight : 0;
            const panelWidth = 384; // px
            const canFitRight = (window.innerWidth - (contentRect?.right || 0)) >= (panelWidth + 24);
            // Always use fixed right sheet for this prototype (no mobile bottom sheet)
            summary.card.style.position = 'fixed';
            summary.card.style.top = headerHeight + 'px';
            summary.card.style.right = '0';
            summary.card.style.left = 'auto';
            summary.card.style.bottom = '0';
            summary.card.style.width = panelWidth + 'px';
            summary.card.style.height = `calc(100vh - ${headerHeight}px)`;
            // update left match card position
            positionLeftMatchCard();
        } else {
            // Hide the receipt panel, but keep/update the left match card visibility
            summary.card.classList.add('hidden');
            rightAside && rightAside.classList.add('hidden');
            // On one-time or recurring screens, the match card remains visible on desktop
            const leftAside = document.getElementById('leftMatchAside');
            if (leftAside) {
                if (state.view === 'oneTime' || state.view === 'recurring') {
                    const headerHeight = header ? header.offsetHeight : 0;
                    if (window.innerWidth >= 1024) {
                        leftAside.classList.remove('hidden');
                        leftAside.style.position = 'fixed';
                        leftAside.style.top = headerHeight + 24 + 'px';
                        leftAside.style.left = '40px';
                    } else {
                        leftAside.classList.add('hidden');
                    }
                } else {
                    leftAside.classList.add('hidden');
                }
            }
        }

        const pledge = state.amount || 0;
        const credits = (state.view === 'oneTime' && state.hasCredits) ? (state.otCreditsApplied || 0) : 0;
        let matchFromCompany = 0;
        const isRecurring = state.view === 'recurring' || (state.view === 'confirmation' && state.donationType === 'recurring');
        if (!state.isNpoEligible) {
            matchFromCompany = 0;
        } else if (isRecurring) {
            const m = typeof state.matchPerInstallment === 'number' ? state.matchPerInstallment : pledge;
            matchFromCompany = Math.max(0, Math.min(m, pledge));
        } else {
            const matchInputEl = document.getElementById('matchAmountInput');
            let userMatchOverrideRaw = matchInputEl ? parseFloat(matchInputEl.value) : NaN;
            // If user has not edited match or typed 0/NaN, mirror pledge by default
            if (!state.matchEdited) {
                userMatchOverrideRaw = pledge;
                if (matchInputEl) matchInputEl.value = String(pledge.toFixed(2));
            }
            const defaultMatch = pledge > 0 ? pledge : 0; // 1x by default
            // If user entered a value higher than pledge, clamp back to 1x
            matchFromCompany = isNaN(userMatchOverrideRaw)
                ? defaultMatch
                : Math.max(0, Math.min(userMatchOverrideRaw, defaultMatch));
        }
        const donationTotal = pledge + credits + (state.isNpoEligible ? matchFromCompany : 0);
        const feeBase = Math.max(0, pledge); // fees apply only to user's pledge
        const fee = isRecurring ? 0 : feeFor(feeBase);
        const total = pledge + fee; // amount due from user
        if (summary.headlineTotal) summary.headlineTotal.textContent = toDollar(donationTotal);
        if (summary.covered) summary.covered.textContent = toDollar(credits + (state.isNpoEligible ? matchFromCompany : 0));
        if (summary.due) summary.due.textContent = toDollar(total);
        if (summary.total) summary.total.textContent = toDollar(donationTotal);
        // Recurring-specific sidebar: relabel and show projection for 2025
        const sumTotalLabel = document.getElementById('sumTotalLabel');
        const projBlock = document.getElementById('sumProjectionBlock');
        const projInstallmentsLine = document.getElementById('sumInstallmentsLine');
        const projPayments = document.getElementById('sumProjectedPayments');
        const projMatchItem = document.getElementById('sumProjectedMatchItem');
        const projMatch = document.getElementById('sumProjectedMatch');
        if (state.view === 'recurring' || (state.view === 'confirmation' && state.donationType === 'recurring')) {
            if (sumTotalLabel) sumTotalLabel.textContent = 'Total donation per donation';
            // Compute installments left and totals
            let projected = 0;
            let projectedMatch = 0;
            let installmentsLeft = 0;
            if (state.cadence && state.recurringStart) {
                const start = parseLocalDate(state.recurringStart);
                if (start) {
                    const yearStart = new Date(2025, 0, 1);
                    const yearEnd = new Date(2025, 11, 31);
                    function next(date) {
                        const d = new Date(date);
                        if (state.cadence === 'weekly') {
                            d.setDate(d.getDate() + 7 * (state.weeklyInterval || 1));
                        } else if (state.cadence === 'semiMonthly') {
                            const day = d.getDate();
                            if (day < 15) d.setDate(15); else { d.setMonth(d.getMonth() + 1); d.setDate(1); }
                        } else { // monthly
                            const nextM = new Date(d);
                            nextM.setMonth(nextM.getMonth() + 1);
                            const target = state.monthlyDay || 1;
                            nextM.setDate(1);
                            const last = new Date(nextM.getFullYear(), nextM.getMonth() + 1, 0).getDate();
                            nextM.setDate(Math.min(target, last));
                            return nextM;
                        }
                        return d;
                    }
                    // Find first occurrence >= yearStart
                    let cursor = new Date(start);
                    // advance cursor into 2025 if needed
                    while (cursor < yearStart) {
                        const n = next(cursor);
                        if (!n || n.getTime() === cursor.getTime()) break;
                        cursor = n;
                    }
                    // count occurrences within 2025 and <= end date if set
                    const endDate = state.endType === 'onDate' && state.recurringEnd ? parseLocalDate(state.recurringEnd) : null;
                    while (cursor >= yearStart && cursor <= yearEnd && (!endDate || cursor <= endDate)) {
                        projected += (state.amount || 0);
                        installmentsLeft++;
                        if (state.isNpoEligible) {
                            const m = Math.min(state.matchPerInstallment || (state.amount || 0), (state.amount || 0));
                            projectedMatch += m;
                        }
                        const n = next(cursor);
                        if (!n || n.getTime() === cursor.getTime()) break;
                        cursor = n;
                    }
                }
            }
            if (projBlock) projBlock.classList.toggle('hidden', !(projected > 0));
            if (projPayments) projPayments.textContent = toDollar(projected);
            if (projMatchItem) projMatchItem.classList.toggle('hidden', !(projectedMatch > 0));
            if (projMatch) projMatch.textContent = toDollar(projectedMatch);
            if (projInstallmentsLine) {
                const span = projInstallmentsLine.querySelector('span');
                if (span) span.textContent = `${installmentsLeft} donations left`;
            }
        } else {
            if (sumTotalLabel) sumTotalLabel.textContent = 'Donation total';
            if (projBlock) projBlock.classList.add('hidden');
        }

        const matchDisplay = document.getElementById('matchDisplay');
        const matchText = document.getElementById('matchDisplayText');
        const matchInputGroup = document.getElementById('matchInputGroup');
        if (matchDisplay && matchText && matchInputGroup) {
            if (pledge > 0 && state.isNpoEligible) {
                matchDisplay.classList.remove('hidden');
                matchText.textContent = `${toDollar(matchFromCompany)} will be matched`;
            } else {
                matchDisplay.classList.add('hidden');
                matchInputGroup.classList.add('hidden');
            }
        }

        // Update sidebar cadence text when recurring
        const sideCadence = document.getElementById('sideCadenceText');
        if (sideCadence) {
            const i1 = document.getElementById('sumIconDue');
            const i2 = document.getElementById('sumIconCovered');
            const i3 = document.getElementById('sumIconTotal');
            if (isRecurring && state.cadence && state.isNpoEligible) {
                let text = '';
                if (state.cadence === 'monthly') {
                    const ord = (n)=>{const s=['th','st','nd','rd'], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]);};
                    text = `Repeats monthly on the ${ord(state.monthlyDay || 1)}`;
                }
                if (state.cadence === 'weekly') {
                    const d = state.weeklyStart ? parseLocalDate(state.weeklyStart) : null;
                    const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                    const weekday = d ? weekdays[d.getDay()] + 's' : 'week';
                    text = `Repeats every ${state.weeklyInterval || 1} week${(state.weeklyInterval||1)===1?'':'s'} on ${weekday}`;
                }
                if (state.cadence === 'semiMonthly') {
                    text = 'Repeats monthly on the 1st and 15th';
                }
                const start = state.recurringStart ? parseLocalDate(state.recurringStart) : null;
                if (start) {
                    const mm = String(start.getMonth()+1).padStart(2,'0');
                    const dd = String(start.getDate()).padStart(2,'0');
                    const yy = String(start.getFullYear()).toString().slice(-2);
                    text += `, starting ${mm}/${dd}/${yy}`;
                }
                // Append explicit end date when user selected one
                const end = (state.endType === 'onDate' && state.recurringEnd) ? parseLocalDate(state.recurringEnd) : null;
                if (end) {
                    const emm = String(end.getMonth()+1).padStart(2,'0');
                    const edd = String(end.getDate()).padStart(2,'0');
                    const eyy = String(end.getFullYear()).toString().slice(-2);
                    text += `, ending ${emm}/${edd}/${eyy}`;
                }
                // Append untilMatch hint when selected
                if (!end && state.endType === 'untilMatch') {
                    text += ', until your program ends or funds run out';
                }
                sideCadence.innerHTML = `<span class="inline-flex items-center gap-2"><i class="ph-bold ph-arrows-clockwise"></i><span>${text}</span></span>`;
                sideCadence.classList.remove('hidden');
                // Keep sidebar icons hidden for recurring
                i1 && i1.classList.add('hidden');
                i2 && i2.classList.add('hidden');
                i3 && i3.classList.add('hidden');
            } else {
                sideCadence.classList.add('hidden');
                i1 && i1.classList.add('hidden');
                i2 && i2.classList.add('hidden');
                i3 && i3.classList.add('hidden');
            }
            // On recurring, hide the due and covered rows; remove tally line; indent only the total amount by 16px
            const dueRow = i1 && i1.closest ? i1.closest('div') : null;
            const coveredRow = i2 && i2.closest ? i2.closest('div') : null;
            const totalRow = i3 && i3.closest ? i3.closest('div') : null;
            const totalAmt = document.getElementById('sumTotal');
            if (isRecurring) {
                dueRow && dueRow.classList.add('hidden');
                // Hide covered row whenever not eligible (no match), or on recurring summary style
                if (coveredRow) coveredRow.classList.add('hidden');
                // remove border/pt tally line on total row
                if (totalRow) { totalRow.classList.remove('border-t', 'pt-2'); }
                // indent amount by 16px
                totalAmt && totalAmt.classList.add('pl-4');
            } else {
                dueRow && dueRow.classList.remove('hidden');
                // Only show covered row when eligible (credits or match); in ineligible state, hide
                if (coveredRow) coveredRow.classList.toggle('hidden', !state.isNpoEligible && ((state.otCreditsApplied||0)===0));
                if (totalRow) { totalRow.classList.add('border-t', 'pt-2'); }
                totalAmt && totalAmt.classList.remove('pl-4');
            }
        }

        // build itemized credit rows
        if (summary.itemization) {
            summary.itemization.innerHTML = '';

            const addItemCard = (title, subtitle, amount, options = {}) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'flex items-center justify-between rounded-md border border-gray-200 bg-white p-3';
                const left = document.createElement('div');
                const titleEl = document.createElement('div');
                titleEl.className = 'font-medium text-zinc-900';
                titleEl.textContent = title;
                const subEl = document.createElement('div');
                subEl.className = 'text-xs text-gray-500';
                subEl.textContent = subtitle;
                left.appendChild(titleEl);
                left.appendChild(subEl);
                const right = document.createElement('div');
                right.className = 'font-medium';
                right.textContent = toDollar(amount);
                if (subtitle === 'Donation credit' || subtitle === 'This is your company match') {
                    right.classList.add('text-emerald-700');
                }
                // spacing below credits handled before pledge group; do not add per-item margin
                wrapper.appendChild(left);
                wrapper.appendChild(right);
                summary.itemization.appendChild(wrapper);
            };

            let itemCount = 0;
            let creditCount = 0;
            let lastCreditEl = null;
            let lastCard; // to connect pledge and match visually regardless of credits count
            // gather checked credit rows
            inputs.creditRows().forEach((row) => {
                if (!state.hasCredits) return; // skip any credits when hasCredits is false
                const enabled = row.querySelector('.credit-enable').checked;
                const labelEl = row.querySelector('label span');
                const name = labelEl ? labelEl.querySelector('.font-medium')?.textContent || labelEl.textContent : 'Donation credit';
                const input = row.querySelector('.credit-input');
                const val = enabled ? (parseFloat(input.value) || 0) : 0;
                if (enabled && val > 0) {
                    lastCreditEl = addItemCard(name.trim(), 'Donation credit', val);
                    lastCard = lastCreditEl;
                    itemCount++;
                    creditCount++;
                }
            });

            // Show connected pledge/match pair only when a pledge is entered (> 0)
            const shouldShowPledgeGroup = (state.view === 'oneTime' || state.view === 'recurring') && pledge > 0;
            if (shouldShowPledgeGroup) {
                // ensure 12px gap below the last credit when pledge/match is present
                if (lastCreditEl) lastCreditEl.classList.add('mb-3');
                // Render as a single grouped container to emphasize relation
                const group = document.createElement('div');
                group.className = 'rounded-md border border-gray-200 bg-white overflow-hidden';
                const addRow = (label, sub, amount, extraClass='') => {
                    const row = document.createElement('div');
                    row.className = 'flex items-center justify-between p-3 ' + extraClass;
                    const left = document.createElement('div');
                    const t = document.createElement('div'); t.className = 'font-medium text-zinc-900'; t.textContent = label;
                    const s = document.createElement('div'); s.className = 'text-xs text-gray-500'; s.textContent = sub;
                    left.appendChild(t); left.appendChild(s);
                    const right = document.createElement('div'); right.className = 'font-medium'; right.textContent = toDollar(amount);
                    if (label.includes('match')) right.classList.add('text-emerald-700');
                    row.appendChild(left); row.appendChild(right);
                    return row;
                };
                const isRec = (state.view === 'recurring') || (state.view === 'confirmation' && state.donationType === 'recurring');
                const myLabel = isRec ? 'My pledge' : 'My donation';
                group.appendChild(addRow(myLabel, 'This is your donation amount', pledge, state.isNpoEligible ? 'border-b border-gray-200' : ''));
                if (state.isNpoEligible) {
                    const matchSub = 'This is your company match';
                    group.appendChild(addRow('CBC Capital match', matchSub, matchFromCompany));
                }
                summary.itemization.appendChild(group);
                itemCount += state.isNpoEligible ? 2 : 1;
            }

            // creditsNote removed from summary panel per updated UX
        }
        updateHeaderCta();
    }

    function renderOneTimeConfirm() {
        if (!views.oneTimeConfirm) return;
        // Compute credits selected
        let totalCredits = 0;
        let count = 0;
        if (reviewEls.list) reviewEls.list.innerHTML = '';
        inputs.creditRows().forEach((row) => {
            const enabled = row.querySelector('.credit-enable').checked;
            const input = row.querySelector('.credit-input');
            const labelEl = row.querySelector('label span');
            const name = labelEl ? labelEl.querySelector('.font-medium')?.textContent || labelEl.textContent : 'Donation credit';
            const val = enabled ? (parseFloat(input.value) || 0) : 0;
            if (enabled && val > 0) {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between px-4 py-2';
                const left = document.createElement('div'); left.className = 'text-[14px]'; left.textContent = name.trim();
                const right = document.createElement('div'); right.className = 'text-[14px] text-emerald-700 font-medium'; right.textContent = toDollar(val);
                item.appendChild(left); item.appendChild(right);
                reviewEls.list.appendChild(item);
                totalCredits += val;
                count++;
            }
        });
        // Title and totals
        if (reviewEls.title) reviewEls.title.textContent = `Let's review your ${toDollar(totalCredits)} donation to Team Rubicon`;
        if (reviewEls.total) reviewEls.total.textContent = toDollar(totalCredits);
        if (reviewEls.totalOrg) reviewEls.totalOrg.textContent = toDollar(totalCredits);
        if (reviewEls.txnCount) reviewEls.txnCount.textContent = String(count);
        const dueEl = document.getElementById('reviewDue');
        if (dueEl) dueEl.textContent = toDollar(0);
        // Initialize note/anon
        if (reviewEls.note) reviewEls.note.value = state.note || '';
        if (reviewEls.anonymous) reviewEls.anonymous.checked = !!state.anonymous;
    }

	function canProceedRecurring() {
		if (!(state.amount >= 5)) return false;
		if (!state.cadence) return false;
		if (state.cadence === 'monthly') {
			if (!state.monthlyDay && state.recurringStart) {
				const d = parseLocalDate(state.recurringStart);
				if (d) state.monthlyDay = d.getDate();
			}
			return !!state.monthlyDay;
		}
		if (state.cadence === 'weekly') return !!state.weeklyInterval && !!state.weeklyStart;
		if (state.cadence === 'semiMonthly') return true;
		return false;
	}

    function canProceedOneTime() {
        const creditsOk = (state.otCreditsApplied || 0) > 0;
        const pledgeOk = state.amount >= 5;
        return creditsOk || pledgeOk;
    }

    // Funding fee math
    function computeFundingFees(amount, method, coverFixed, includeCardPercent) {
        // Fixed fee ($0.50) is waived for recurring; card fee (2.9%) applies if paying by card
        const fixedDisplay = state.donationType === 'recurring' ? 0 : 0.50;
        const card = (method === 'card') ? amount * 0.029 : 0; // percent portion (always positive)
        const dueFixed = state.donationType === 'recurring' ? 0 : (coverFixed ? 0.50 : 0);
        const dueFee = dueFixed + card; // what the user actually pays in fees
        return { fixedDisplay, card, dueFee };
    }

    function renderFunding() {
        // Determine selected method directly from DOM to avoid stale state
        const selected = document.querySelector('input[name="fundingMethod"]:checked');
        if (selected && selected.value) state.fundingMethod = selected.value;
        const pledge = state.amount || 0;
        if (fundingEls.amountLabel) fundingEls.amountLabel.textContent = toDollar(pledge);
        // Recurring copy tweaks
        const titleEl = document.getElementById('fundingTitle');
        if (titleEl && state.donationType === 'recurring') {
            titleEl.textContent = `How would you like to give your ${toDollar(pledge)}?`;
        }
        const donationLabel = document.getElementById('fundingDonationLabel');
        if (donationLabel && state.donationType === 'recurring') donationLabel.textContent = 'Your recurring pledge';
        if (fundingEls.gsaBalanceLabel) fundingEls.gsaBalanceLabel.textContent = toDollar(state.gsaBalance);
        const coverFee = !!(fundingEls.coverFee && fundingEls.coverFee.checked);
        // Card processing fee cannot be waived; only the fixed fee is waived
        const includeCardPct = (state.fundingMethod === 'card');
        const fees = computeFundingFees(pledge, state.fundingMethod, coverFee, includeCardPct);
        if (fundingEls.balance) fundingEls.balance.textContent = toDollar(pledge);
        if (fundingEls.feeFixed) fundingEls.feeFixed.textContent = toDollar(fees.fixedDisplay);
        if (fundingEls.feeCardRow) fundingEls.feeCardRow.classList.toggle('hidden', !includeCardPct);
        if (fundingEls.feeCard) fundingEls.feeCard.textContent = toDollar(fees.card);
        const totalDue = pledge + fees.dueFee;
        if (fundingEls.total) fundingEls.total.textContent = toDollar(totalDue);
        if (fundingEls.donationRow) fundingEls.donationRow.textContent = toDollar(pledge);
        // Amount going to Team Rubicon (one-time with pledge path only)
        const goingRow = document.getElementById('fundingGoingRow');
        const goingAmt = document.getElementById('fundingGoingAmount');
        if (goingRow && goingAmt) {
            const isCreditsOnly = state.view === 'oneTime' && (state.amount < 5) && (state.otCreditsApplied || 0) > 0;
            if (state.donationType !== 'recurring' && !isCreditsOnly) {
                const coverFixed = !!(fundingEls.coverFee && fundingEls.coverFee.checked);
                const creditsApplied = state.hasCredits ? (state.otCreditsApplied || 0) : 0;
                const going = creditsApplied + pledge - (coverFixed ? 0 : 0.50);
                goingAmt.textContent = toDollar(Math.max(0, going));
                goingRow.classList.remove('hidden');
            } else {
                goingRow.classList.add('hidden');
            }
        }
        // Show contextual action buttons
        const addBankWrap = document.getElementById('addBankWrap');
        const addCardWrap = document.getElementById('addCardWrap');
        if (addBankWrap) addBankWrap.classList.toggle('hidden', state.fundingMethod !== 'bankAdd');
        // Remove card add flow in funding: always hide the button
        if (addCardWrap) addCardWrap.classList.add('hidden');
        // Cross out fixed fee row when user unchecks "I'll cover" (always keep struck on recurring)
        (function updateFixedFeeStrike() {
            const crossed = fundingEls.coverFee ? !fundingEls.coverFee.checked : false;
            const fixedLabelEl = document.getElementById('fundingFeeFixedLabel');
            const shouldStrike = state.donationType === 'recurring' || crossed;
            fixedLabelEl && fixedLabelEl.classList.toggle('line-through', shouldStrike);
            fundingEls.feeFixed && fundingEls.feeFixed.classList.toggle('line-through', shouldStrike);
        })();
        // Update card button label and added indicator based on state
        const cardBtn = document.getElementById('addCardBtn');
        const cardAdded = document.getElementById('cardAdded');
        // Hide any remnants of the card-add UI
        if (cardBtn) cardBtn.classList.add('hidden');
        if (cardAdded) cardAdded.classList.add('hidden');
        // Groundswell insufficient
        const insufficient = state.fundingMethod === 'gsa' && state.gsaBalance < pledge;
        if (fundingEls.gsaError) fundingEls.gsaError.classList.toggle('hidden', !insufficient);
        // Hide cover fee checkbox on recurring funding screen
        const coverWrap = document.getElementById('coverFeeFunding')?.closest('label');
        coverWrap && coverWrap.classList.toggle('hidden', state.donationType === 'recurring');
        // Toggle header cta
        const canContinue = !insufficient;
        if (buttons.checkout) buttons.checkout.disabled = !canContinue;
        const sideBtn = document.getElementById('checkoutBtnSide');
        sideBtn && (sideBtn.disabled = !canContinue);
        // Ensure side panel is hidden on funding screen
        summary.card && summary.card.classList.add('hidden');
        rightAside && rightAside.classList.add('hidden');
        // Ensure header is visible on funding screen
        header && header.classList.remove('hidden');
        updateProgressBar();

        // Cadence text on funding screen (blue)
        const fct = document.getElementById('fundingCadenceText');
        if (fct && state.donationType === 'recurring' && state.isNpoEligible) {
            let text = '';
            if (state.cadence === 'monthly') {
                const ord = (n)=>{const s=['th','st','nd','rd'], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]);};
                text = `Repeats monthly on the ${ord(state.monthlyDay || 1)}`;
            } else if (state.cadence === 'weekly') {
                const d = state.weeklyStart ? parseLocalDate(state.weeklyStart) : null;
                const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                const weekday = d ? weekdays[d.getDay()] + 's' : 'week';
                text = `Repeats every ${state.weeklyInterval || 1} week${(state.weeklyInterval||1)===1?'':'s'} on ${weekday}`;
            } else if (state.cadence === 'semiMonthly') {
                text = 'Repeats monthly on the 1st and 15th';
            }
            const start = state.recurringStart ? parseLocalDate(state.recurringStart) : null;
            if (start) {
                const mm = String(start.getMonth()+1).padStart(2,'0');
                const dd = String(start.getDate()).padStart(2,'0');
                const yy = String(start.getFullYear()).toString().slice(-2);
                text += `, starting ${mm}/${dd}/${yy}`;
            }
            // Append explicit end date when user selected one
            const end = (state.endType === 'onDate' && state.recurringEnd) ? parseLocalDate(state.recurringEnd) : null;
            if (end) {
                const emm = String(end.getMonth()+1).padStart(2,'0');
                const edd = String(end.getDate()).padStart(2,'0');
                const eyy = String(end.getFullYear()).toString().slice(-2);
                text += `, ending ${emm}/${edd}/${eyy}`;
            }
            // Append untilMatch hint when selected
            if (!end && state.endType === 'untilMatch') {
                text += ', until your program ends or funds run out';
            }
            fct.textContent = text;
            fct.classList.remove('hidden');
        }
        const dueLabel = document.getElementById('fundingDueLabel');
        // Strike-through logic: always strike on recurring; on one-time strike when user is NOT covering
        const fixedLabel = document.getElementById('fundingFeeFixedLabel');
        const noFees = document.getElementById('fundingNoFeesBadge');
        if (state.donationType === 'recurring') {
            dueLabel && (dueLabel.textContent = 'Amount due each donation');
            const shouldStrike = true;
            fixedLabel && fixedLabel.classList.toggle('line-through', shouldStrike);
            fundingEls.feeFixed && fundingEls.feeFixed.classList.toggle('line-through', shouldStrike);
            noFees && noFees.classList.remove('hidden');
        } else {
            dueLabel && (dueLabel.textContent = 'Amount to pay');
            const shouldStrike = !coverFee;
            fixedLabel && fixedLabel.classList.toggle('line-through', shouldStrike);
            fundingEls.feeFixed && fundingEls.feeFixed.classList.toggle('line-through', shouldStrike);
            noFees && noFees.classList.add('hidden');
        }
    }

	// Inject options
	(function initOptions() {
		if (inputs.monthlyDay) {
			for (let d = 1; d <= 31; d++) {
				const opt = document.createElement('option');
				opt.value = String(d);
				opt.textContent = String(d);
				inputs.monthlyDay.appendChild(opt);
			}
		}
		if (inputs.weeklyInterval) {
			for (let w = 1; w <= 8; w++) {
				const opt = document.createElement('option');
				opt.value = String(w);
				opt.textContent = String(w);
				inputs.weeklyInterval.appendChild(opt);
			}
		}
	})();

	// Event wiring
    // Credits button → open modal, lock to one-time
    buttons.startDonate && buttons.startDonate.addEventListener('click', () => {
        state.hasCredits = true;
        state.isNpoEligible = true;
        chooseLockOneTime = true;
        openChooseModal();
    });
    // No-credits button → open modal to choose one-time or recurring
    buttons.startDonateNoCredits && buttons.startDonateNoCredits.addEventListener('click', () => {
        state.hasCredits = false;
        state.isNpoEligible = true;
        state.otCreditsApplied = 0; // ensure no stale credit carries into sidebar
        openChooseModal();
    });
    // NPO ineligible path → no credits and no match program
    buttons.startDonateNpoIneligible && buttons.startDonateNpoIneligible.addEventListener('click', () => {
        state.hasCredits = false;
        state.isNpoEligible = false;
        state.otCreditsApplied = 0;
        openChooseModal();
    });
    buttons.oneTimeBack && buttons.oneTimeBack.addEventListener('click', () => openChooseModal());
    buttons.recurringBack && buttons.recurringBack.addEventListener('click', () => openChooseModal());
    // Header/side actions
    function triggerCheckout() {
        if (state.view === 'recurring' && canProceedRecurring()) {
            // Recurring now goes to funding selection first (same as one-time)
            show('oneTimeFunding');
            header && header.classList.remove('hidden');
            renderFunding();
            updateProgressBar();
            return;
        }
        if (state.view === 'oneTimeFunding') {
            // Proceed to pledge/match confirmation
            show('oneTimePledgeConfirm');
            renderPledgeConfirm();
            return;
        }
        if (state.view === 'oneTime' && canProceedOneTime()) {
            const credits = state.otCreditsApplied || 0;
            const pledgeOk = state.amount >= 5;
            if (!pledgeOk && credits > 0) {
                // Credits-only confirmation flow
                show('oneTimeConfirm');
                renderOneTimeConfirm();
                // Hide receipt panel explicitly
                summary.card && summary.card.classList.add('hidden');
                rightAside && rightAside.classList.add('hidden');
                updateProgressBar();
                return;
            }
            // Pledge path → funding screen
            show('oneTimeFunding');
            // Ensure header visible and progress at 75%
            header && header.classList.remove('hidden');
            renderFunding();
            updateProgressBar();
            return;
        }
    }
    buttons.checkout && buttons.checkout.addEventListener('click', triggerCheckout);
    document.getElementById('checkoutBtnSide')?.addEventListener('click', triggerCheckout);

    document.getElementById('exitBtn')?.addEventListener('click', () => {
        // If no selection made, just exit
        const hasAnySelection = !!(state.amount || state.otCreditsApplied || state.cadence || state.recurringStart || state.recurringEnd);
        if (!hasAnySelection) { show('start'); return; }
        const modal = document.getElementById('exitConfirm');
        if (!modal) { show('start'); return; }
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        const cancelBtn = document.getElementById('exitCancelBtn');
        const confirmBtn = document.getElementById('exitConfirmBtn');
        const close = () => { modal.classList.add('hidden'); modal.classList.remove('flex'); };
        cancelBtn && cancelBtn.addEventListener('click', close, { once: true });
        confirmBtn && confirmBtn.addEventListener('click', () => {
            close();
            // Hard reset all flow state before returning to start
            resetAllState();
            show('start');
            recomputeSummary();
            updateProgressBar();
        }, { once: true });
        // click outside to close
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); }, { once: true });
    });

	Array.from(document.querySelectorAll('input[name="donationType"]')).forEach((input) => {
		input.addEventListener('change', () => {
			state.donationType = input.value;
			buttons.chooseContinue.disabled = false;
		});
	});

    // Modal selection cards
    const chooseContainer = document.getElementById('view-choose');
    function handleSelectCard(cardEl) {
        if (!cardEl || !chooseContainer || chooseContainer.classList.contains('hidden')) return;
        const type = cardEl.getAttribute('data-type');
        if (chooseLockOneTime && type === 'recurring') return;
        state.donationType = type;
        if (buttons.chooseContinue) { buttons.chooseContinue.disabled = false; buttons.chooseContinue.removeAttribute('disabled'); }
        Array.from(document.querySelectorAll('#view-choose .select-card')).forEach((c) => c.classList.remove('selected'));
        cardEl.classList.add('selected');
    }
    Array.from(document.querySelectorAll('#view-choose .select-card')).forEach((card) => {
        card.addEventListener('click', (e) => { e.stopPropagation(); handleSelectCard(card); });
    });

    const chooseCloseBtn = document.getElementById('chooseCloseBtn');
    const chooseCancelBtn = document.getElementById('chooseCancelBtn');
    chooseCloseBtn && chooseCloseBtn.addEventListener('click', (e) => { e.stopPropagation(); closeChooseModal(); });
    chooseCancelBtn && chooseCancelBtn.addEventListener('click', (e) => { e.stopPropagation(); closeChooseModal(); });

	// Click outside modal to close
    const chooseOverlay = document.getElementById('view-choose');
    if (chooseOverlay) {
        // close on backdrop click only; clicks inside the card should not bubble to close
        chooseOverlay.addEventListener('click', (e) => {
            if (e.target === chooseOverlay) {
                closeChooseModal();
            }
        });
        // stop propagation for inner card area
        const cardEl = chooseOverlay.querySelector('.card');
        cardEl && cardEl.addEventListener('click', (e) => e.stopPropagation());
    }

    buttons.chooseContinue && buttons.chooseContinue.addEventListener('click', () => {
        const selected = state.donationType; // capture before modal clears state
        closeChooseModal();
        if (selected === 'oneTime') { show('oneTime'); toggleCreditsUI(); }
        if (selected === 'recurring') { state.donationType = 'recurring'; initRecurringDefaults(); show('recurring'); toggleCreditsUI(); }
        recomputeSummary();
    });

    function toggleCreditsUI() {
        const banner = document.getElementById('creditsBanner');
        const card = document.getElementById('creditsCardContainer');
        const note = document.getElementById('creditsEligibilityNote');
        const personalFundsHeading = document.getElementById('personalFundsHeading');
        const oneTimeProgramCard = document.getElementById('oneTimeProgramCard');
        const npoBadgeOneTime = document.getElementById('npoBadgeOneTime');
        const npoBadgeRecurring = document.getElementById('npoBadgeRecurring');
        const recurringProgramCard = document.getElementById('recurringProgramCard');
        const recurringMatchDisplay = document.getElementById('recurringMatchDisplay');
        if (banner) banner.classList.toggle('hidden', !state.hasCredits);
        if (card) card.classList.toggle('hidden', !state.hasCredits);
        if (note) note.classList.add('hidden');
        // Hide the personal funds/company match heading when there are no credits
        if (personalFundsHeading) personalFundsHeading.classList.toggle('hidden', !state.hasCredits);
        // Hide one-time program card when NPO not eligible
        if (oneTimeProgramCard) oneTimeProgramCard.classList.toggle('hidden', !state.isNpoEligible);
        // Hide recurring match UI when NPO not eligible
        if (recurringProgramCard) recurringProgramCard.classList.toggle('hidden', !state.isNpoEligible);
        if (recurringMatchDisplay) recurringMatchDisplay.classList.toggle('hidden', !state.isNpoEligible);
        // Show/hide NPO ineligible badge per view
        if (npoBadgeOneTime) npoBadgeOneTime.classList.toggle('hidden', state.isNpoEligible || state.view !== 'oneTime');
        if (npoBadgeRecurring) npoBadgeRecurring.classList.toggle('hidden', state.isNpoEligible || state.view !== 'recurring');
        // Also clear credits when toggled off
        if (!state.hasCredits) state.otCreditsApplied = 0;
    }

    // Header back button behavior (context-aware)
    buttons.backToDonation && buttons.backToDonation.addEventListener('click', () => {
        // From funding screen
        if (state.view === 'oneTimeFunding') {
            if (state.donationType === 'recurring') {
                show('recurring');
                recomputeSummary();
                updateProgressBar();
                return;
            } else {
                show('oneTime');
                recomputeSummary();
                updateProgressBar();
                return;
            }
        }
        // From pledge confirmation (recurring path) → back to funding source
        if (state.view === 'oneTimePledgeConfirm') {
            show('oneTimeFunding');
            header && header.classList.remove('hidden');
            renderFunding();
            updateProgressBar();
            return;
        }
        // From credits-only confirmation → back to donation selection
        if (state.view === 'oneTimeConfirm') {
            show('oneTime');
            recomputeSummary();
            updateProgressBar();
            return;
        }
        // Fallback
        show('oneTime');
        recomputeSummary();
        updateProgressBar();
    });

    // Funding interactions
    const fundingView = document.getElementById('view-oneTimeFunding');
    function handleFundingMethodEvent() {
        // Re-render after the browser updates the checked state
        setTimeout(renderFunding, 0);
    }
    if (fundingView) {
        ['change','input','click'].forEach((ev) => fundingView.addEventListener(ev, handleFundingMethodEvent));
    }
    fundingEls.coverFee && fundingEls.coverFee.addEventListener('change', () => {
        // Update strike immediately based on checkbox state
        const fixedLabelEl = document.getElementById('fundingFeeFixedLabel');
        const crossed = !fundingEls.coverFee.checked;
        const shouldStrike = state.donationType === 'recurring' || crossed;
        fixedLabelEl && fixedLabelEl.classList.toggle('line-through', shouldStrike);
        fundingEls.feeFixed && fundingEls.feeFixed.classList.toggle('line-through', shouldStrike);
        renderFunding();
    });
    // Switch to bank quick link
    document.getElementById('switchToBankLink')?.addEventListener('click', () => {
        const addBank = document.querySelector('input[name="fundingMethod"][value="bankSaved"]');
        if (addBank) {
            addBank.checked = true;
            state.fundingMethod = 'bankSaved';
            renderFunding();
        }
    });

    // Center continue button mirrors header action
    document.getElementById('fundingContinueBtn')?.addEventListener('click', () => {
        if (buttons.checkout) {
            buttons.checkout.click();
        } else {
            // fallback: proceed
            triggerCheckout();
        }
    });

    function renderPledgeConfirm() {
        header && header.classList.remove('hidden');
        updateProgressBar();
        // Build list
        if (pledgeConfirmEls.list) pledgeConfirmEls.list.innerHTML = '';
        let txn = 0; let total = 0;
        // credits
        inputs.creditRows().forEach((row) => {
            const enabled = row.querySelector('.credit-enable').checked;
            const input = row.querySelector('.credit-input');
            const labelEl = row.querySelector('label span');
            const name = labelEl ? labelEl.querySelector('.font-medium')?.textContent || labelEl.textContent : 'Donation credit';
            const val = enabled ? (parseFloat(input.value) || 0) : 0;
            if (enabled && val > 0) {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between px-4 py-2';
                const left = document.createElement('div'); left.className = 'text-[14px]'; left.textContent = name.trim();
                const right = document.createElement('div'); right.className = 'text-[14px] text-emerald-700 font-medium'; right.textContent = toDollar(val);
                item.appendChild(left); item.appendChild(right);
                pledgeConfirmEls.list.appendChild(item);
                total += val; txn++;
            }
        });
        const pledge = state.amount || 0;
        if (pledge > 0) {
            // pledge and match
            const addRow = (label, amount) => {
                const row = document.createElement('div');
                row.className = 'flex items-center justify-between px-4 py-2';
                const left = document.createElement('div'); left.className = 'text-[14px]'; left.textContent = label;
                const right = document.createElement('div'); right.className = 'text-[14px] font-medium'; right.textContent = toDollar(amount);
                row.appendChild(left); row.appendChild(right); return row;
            };
            const matchAmt = state.isNpoEligible ? pledge : 0; // 1x default behavior for prototype, unless ineligible
            // Match first (green), then my donation (only when eligible)
            if (state.isNpoEligible && matchAmt > 0) {
                const row = document.createElement('div');
                row.className = 'flex items-center justify-between px-4 py-2';
                const left = document.createElement('div'); left.className = 'text-[14px]'; left.textContent = 'CBC Capital match';
                const right = document.createElement('div'); right.className = 'text-[14px] text-emerald-700 font-medium'; right.textContent = toDollar(matchAmt);
                row.appendChild(left); row.appendChild(right);
                pledgeConfirmEls.list.appendChild(row);
            }
            const isRecConfirm = state.donationType === 'recurring';
            pledgeConfirmEls.list.appendChild(addRow(isRecConfirm ? 'My pledge' : 'My donation', pledge));
            total += pledge + (state.isNpoEligible ? matchAmt : 0); txn += (state.isNpoEligible && matchAmt > 0) ? 2 : 1;
        }
        if (pledgeConfirmEls.total) pledgeConfirmEls.total.textContent = toDollar(total);
        if (pledgeConfirmEls.txn) pledgeConfirmEls.txn.textContent = String(txn);
        // Pay method
        if (pledgeConfirmEls.payMethod) {
            let label = '';
            if (state.fundingMethod === 'bankSaved') label = 'Chase -XXXX';
            if (state.fundingMethod === 'bankSaved2') label = 'Wells Fargo -1234';
            if (state.fundingMethod === 'bankAdd') label = 'Bank account';
            if (state.fundingMethod === 'gsa') label = 'Groundswell Giving Account';
            if (state.fundingMethod === 'card') label = 'Credit/Debit card';
            pledgeConfirmEls.payMethod.textContent = label;
        }
        // Due and CTA
        const coverFixed = !!(fundingEls.coverFee && fundingEls.coverFee.checked);
        const includeCardPct = state.fundingMethod === 'card';
        const fees = computeFundingFees(pledge, state.fundingMethod, coverFixed, includeCardPct);
        const due = pledge + fees.dueFee;
        if (pledgeConfirmEls.due) pledgeConfirmEls.due.textContent = toDollar(due);
        const isRecurringConfirm = state.donationType === 'recurring';
        if (pledgeConfirmEls.title) pledgeConfirmEls.title.textContent = `Let's review your ${toDollar(total)} ${isRecurringConfirm ? 'recurring ' : ''}donation to Team Rubicon`;
        if (pledgeConfirmEls.donateBtn) {
            const span = pledgeConfirmEls.donateBtn.querySelector('span');
            if (span) span.textContent = (state.donationType === 'recurring') ? 'Donate and schedule payments' : `Donate and pay ${toDollar(due)}`;
        }
        // Show fee breakdown and include card fee when paying by card
        const feeBreak = document.getElementById('pledgeFeeBreakdown');
        const feeDonation = document.getElementById('pledgeConfirmDonationAmount');
        const feeFixed = document.getElementById('pledgeConfirmFeeFixed');
        const feeCardRow = document.getElementById('pledgeConfirmFeeCardRow');
        const feeCardAmt = document.getElementById('pledgeConfirmFeeCard');
        if (feeBreak && feeDonation && feeFixed) {
            const payingByCard = state.fundingMethod === 'card';
            const covers = !!(fundingEls.coverFee && fundingEls.coverFee.checked);
            const feeFixedRow = feeFixed.parentElement;
            // Donation base always shown
            feeDonation.textContent = toDollar(pledge);
            // Fixed fee row visibility
            if (!isRecurringConfirm && covers) {
                feeFixed.textContent = toDollar(0.50);
                feeFixedRow && feeFixedRow.classList.remove('hidden');
            } else {
                feeFixed.textContent = toDollar(0);
                feeFixedRow && feeFixedRow.classList.add('hidden');
            }
            // Card percentage line visibility
            if (feeCardRow && feeCardAmt) {
                if (payingByCard) {
                    feeCardAmt.textContent = toDollar(pledge * 0.029);
                    feeCardRow.classList.remove('hidden');
                } else {
                    feeCardRow.classList.add('hidden');
                }
            }
            // Hide entire breakdown if no rows are visible
            const hasAnyRow = (feeFixedRow && !feeFixedRow.classList.contains('hidden')) || (feeCardRow && !feeCardRow.classList.contains('hidden'));
            feeBreak.classList.toggle('hidden', !hasAnyRow);
        }
        // Note/anon defaults from state
        if (pledgeConfirmEls.note) pledgeConfirmEls.note.value = state.note || '';
        if (pledgeConfirmEls.anonymous) pledgeConfirmEls.anonymous.checked = !!state.anonymous;
        // Blue cadence copy above donate button
        const cadEl = document.getElementById('pledgeCadenceText');
        const pledgeDueIcon = document.getElementById('pledgeDueIcon');
        if (cadEl) {
            if (isRecurringConfirm && state.isNpoEligible) {
                let text = '';
                if (state.cadence === 'monthly') {
                    const ord = (n)=>{const s=['th','st','nd','rd'], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]);};
                    text = `Repeats monthly on the ${ord(state.monthlyDay || 1)}`;
                } else if (state.cadence === 'weekly') {
                    const d = state.weeklyStart ? parseLocalDate(state.weeklyStart) : null;
                    const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                    const weekday = d ? weekdays[d.getDay()] + 's' : 'week';
                    text = `Repeats every ${state.weeklyInterval || 1} week${(state.weeklyInterval||1)===1?'':'s'} on ${weekday}`;
                } else if (state.cadence === 'semiMonthly') {
                    text = 'Repeats monthly on the 1st and 15th';
                }
                const start = state.recurringStart ? parseLocalDate(state.recurringStart) : null;
                if (start) {
                    const mm = String(start.getMonth()+1).padStart(2,'0');
                    const dd = String(start.getDate()).padStart(2,'0');
                    const yy = String(start.getFullYear()).toString().slice(-2);
                    text += `, starting ${mm}/${dd}/${yy}`;
                }
                // Append explicit end date when user selected one
                const end = (state.endType === 'onDate' && state.recurringEnd) ? parseLocalDate(state.recurringEnd) : null;
                if (end) {
                    const emm = String(end.getMonth()+1).padStart(2,'0');
                    const edd = String(end.getDate()).padStart(2,'0');
                    const eyy = String(end.getFullYear()).toString().slice(-2);
                    text += `, ending ${emm}/${edd}/${eyy}`;
                }
                // Append untilMatch hint when selected
                if (!end && state.endType === 'untilMatch') {
                    text += ', until your program ends or funds run out';
                }
                cadEl.textContent = text;
                cadEl.classList.remove('hidden');
                pledgeDueIcon && pledgeDueIcon.classList.remove('hidden');
            } else {
                cadEl.classList.add('hidden');
                pledgeDueIcon && pledgeDueIcon.classList.add('hidden');
            }
        }
    }

    pledgeConfirmEls.donateBtn && pledgeConfirmEls.donateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Open Stripe modal first if card; on close it routes to success
        const m = document.getElementById('modalStripe');
        if (m && state.fundingMethod === 'card') { m.classList.remove('hidden'); m.classList.add('flex'); return; }
        // Fallback if modal missing or not paying by card
        const dueText = pledgeConfirmEls.due ? pledgeConfirmEls.due.textContent : '$0.00';
        if (successEls.charged) successEls.charged.textContent = `You were charged ${dueText}`;
        openSuccessModal();
    });
    // Open modals
    document.getElementById('addBankBtn')?.addEventListener('click', () => {
        const m = document.getElementById('modalPlaid');
        if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
    });
    document.getElementById('modalPlaidClose')?.addEventListener('click', () => {
        const m = document.getElementById('modalPlaid');
        if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
        // Show the second saved bank account option
        const sb2 = document.getElementById('savedBank2Wrap');
        if (sb2) {
            sb2.classList.remove('hidden');
            // select it
            const rb = sb2.querySelector('input[type="radio"]');
            if (rb) { rb.checked = true; state.fundingMethod = rb.value; }
            renderFunding();
        }
    });
    // Move Stripe flow to confirmation donate actions
    document.getElementById('modalStripeClose')?.addEventListener('click', () => {
        const m = document.getElementById('modalStripe');
        if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
        // After closing Stripe, go to success screen
        openSuccessModal();
    });

    // Delegated safety net (in case buttons are re-rendered)
    document.addEventListener('click', (e) => {
        const openPlaid = e.target && (e.target.id === 'addBankBtn' || e.target.closest && e.target.closest('#addBankBtn'));
        if (openPlaid) {
            const m = document.getElementById('modalPlaid');
            if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
        }
        // removed: opening stripe from funding
        const closePlaid = e.target && (e.target.id === 'modalPlaidClose' || e.target.closest && e.target.closest('#modalPlaidClose'));
        if (closePlaid) {
            const m = document.getElementById('modalPlaid');
            if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
            const sb2 = document.getElementById('savedBank2Wrap');
            if (sb2) sb2.classList.remove('hidden');
        }
        // handled globally above
    });

	inputs.amountChips.addEventListener('click', (e) => {
		const btn = e.target.closest('[data-amount]');
		if (!btn) return;
		const val = parseFloat(btn.getAttribute('data-amount')) || 0;
		state.amount = val;
		if (inputs.customAmount) inputs.customAmount.value = String(val);
		inputs.amountError.classList.toggle('hidden', val >= 5);
		Array.from(inputs.amountChips.querySelectorAll('.chip')).forEach((el) => el.classList.remove('active'));
		btn.classList.add('active');
		// Mirror pledge at 1x for current flow
		if (state.view === 'recurring' || state.donationType === 'recurring') {
			const rm = document.getElementById('recurringMatchInput');
			if (rm) rm.value = String(state.amount.toFixed(2));
			state.matchPerInstallment = state.amount;
			state.matchEdited = false;
			updateRecurringMatchUi();
		} else {
			const matchInputEl = document.getElementById('matchAmountInput');
			if (matchInputEl) {
				matchInputEl.value = String(state.amount.toFixed(2));
				state.matchEdited = false;
			}
		}
		recomputeSummary();
		projectAndRenderProgram();
		validateRecurring();
	});

	inputs.customAmount.addEventListener('input', () => {
		const val = parseFloat(inputs.customAmount.value);
		state.amount = isNaN(val) ? 0 : val;
		inputs.amountError.classList.toggle('hidden', state.amount >= 5);
		Array.from(inputs.amountChips.querySelectorAll('.chip')).forEach((el) => el.classList.remove('active'));
		if (state.view === 'recurring' || state.donationType === 'recurring') {
			const rm = document.getElementById('recurringMatchInput');
			const mirrored = state.amount > 0 ? state.amount : 0;
			if (rm) rm.value = String(mirrored.toFixed(2));
			state.matchPerInstallment = mirrored;
			state.matchEdited = false;
			updateRecurringMatchUi();
		}
		recomputeSummary();
		projectAndRenderProgram();
		validateRecurring();
	});

	// One-time amount
	inputs.otAmountChips.addEventListener('click', (e) => {
		const btn = e.target.closest('[data-amount]');
		if (!btn) return;
		const val = parseFloat(btn.getAttribute('data-amount')) || 0;
		state.amount = val;
		if (inputs.otCustomAmount) inputs.otCustomAmount.value = String(val);
		inputs.otAmountError.classList.toggle('hidden', val >= 5);
		Array.from(inputs.otAmountChips.querySelectorAll('.chip')).forEach((el) => el.classList.remove('active'));
		btn.classList.add('active');
		recomputeSummary();
	});

	inputs.otCustomAmount.addEventListener('input', () => {
		const val = parseFloat(inputs.otCustomAmount.value);
		state.amount = isNaN(val) ? 0 : val;
		inputs.otAmountError.classList.toggle('hidden', state.amount >= 5);
		Array.from(inputs.otAmountChips.querySelectorAll('.chip')).forEach((el) => el.classList.remove('active'));
        const matchInputEl = document.getElementById('matchAmountInput');
        if (matchInputEl) {
            matchInputEl.value = String((state.amount > 0 ? state.amount : 0).toFixed(2));
            state.matchEdited = false;
        }
		recomputeSummary();
	});

    // Reflect manual match override
    const matchAmountEl = document.getElementById('matchAmountInput');
    matchAmountEl?.addEventListener('input', () => {
        // Clamp to 1x if user exceeds pledge; keep value synced
        const input = document.getElementById('matchAmountInput');
        const currentPledge = state.amount > 0 ? state.amount : 0;
        if (input) {
            let val = parseFloat(input.value);
            if (isNaN(val)) val = 0;
            if (val > currentPledge) {
                input.value = String(currentPledge.toFixed(2));
            }
        }
        state.matchEdited = true;
        recomputeSummary();
    });
    // Close edit on Enter
    matchAmountEl?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const display = document.getElementById('matchDisplay');
            const inputGroup = document.getElementById('matchInputGroup');
            if (display && inputGroup) {
                inputGroup.classList.add('hidden');
                display.classList.remove('hidden');
            }
        }
    });
    // Edit button to switch to input
    document.getElementById('editMatchBtn')?.addEventListener('click', () => {
        const display = document.getElementById('matchDisplay');
        const inputGroup = document.getElementById('matchInputGroup');
        if (display && inputGroup) {
            display.classList.add('hidden');
            inputGroup.classList.remove('hidden');
            const input = document.getElementById('matchAmountInput');
            input && input.focus();
        }
    });

	// Credits inputs
    function recalcCredits() {
		let total = 0;
		inputs.creditRows().forEach((row) => {
			const enabled = row.querySelector('.credit-enable').checked;
			const input = row.querySelector('.credit-input');
			let val = parseFloat(input.value) || 0;
			const max = parseFloat(input.getAttribute('data-max')) || Infinity;
			if (val > max) { val = max; input.value = String(max); }
			if (enabled) total += val;
		});
		// credits cannot exceed amount
        state.otCreditsApplied = Math.min(state.amount + total, total); // additive donation model, but user due only on pledge
	}

    inputs.creditRows().forEach((row) => {
        const enable = row.querySelector('.credit-enable');
        const input = row.querySelector('.credit-input');
        const inputGroup = row.querySelector('.credit-input-group');
        const syncVisibility = () => {
            if (enable.checked) {
                inputGroup.classList.remove('hidden');
            } else {
                inputGroup.classList.add('hidden');
            }
        };
        enable.addEventListener('change', () => { syncVisibility(); recalcCredits(); recomputeSummary(); });
        input.addEventListener('input', () => { recalcCredits(); recomputeSummary(); });
        // initialize hidden state
        syncVisibility();
    });

inputs.userCoversFee && inputs.userCoversFee.addEventListener('change', () => {
    state.userCoversFee = inputs.userCoversFee.checked;
    recomputeSummary();
});

    // Note and anonymous
    reviewEls.note && reviewEls.note.addEventListener('input', () => { state.note = reviewEls.note.value; });
    reviewEls.anonymous && reviewEls.anonymous.addEventListener('change', () => { state.anonymous = reviewEls.anonymous.checked; });

    // Donate submit → show success modal with total impact
    function openSuccessModal() {
        const inPledgeConfirm = views.oneTimePledgeConfirm && !views.oneTimePledgeConfirm.classList.contains('hidden');
        const impactText = inPledgeConfirm
            ? (pledgeConfirmEls.total ? pledgeConfirmEls.total.textContent : toDollar(0))
            : (reviewEls.totalOrg ? reviewEls.totalOrg.textContent : toDollar(0));
        const amountDue = inPledgeConfirm
            ? (pledgeConfirmEls.due ? pledgeConfirmEls.due.textContent : toDollar(0))
            : toDollar(0);
        // Show/hide charged line: show for one-time pledge, hide for credits-only and all recurring
        const isRecurring = state.donationType === 'recurring';
        if (successEls.charged) {
            if (isRecurring) {
                successEls.charged.classList.add('hidden');
            } else {
                if (amountDue !== toDollar(0)) {
                    successEls.charged.textContent = `You were charged ${amountDue}`;
                    successEls.charged.classList.remove('hidden');
                } else {
                    successEls.charged.classList.add('hidden');
                }
            }
        }
        if (successEls.impact && typeof impactText === 'string') successEls.impact.textContent = impactText;
        // Recurring-specific copy
        const thanksEl = document.getElementById('donateThanks');
        const recurNote = document.getElementById('donateRecurringNote');
        if (thanksEl) {
            if (isRecurring) {
                thanksEl.innerHTML = `Thank you! Your recurring donation has been scheduled for`;
            } else {
                thanksEl.innerHTML = `Thank you! Your total donation of <span id="donateImpact">${impactText}</span> is on its way to`;
            }
        }
        if (recurNote) recurNote.classList.toggle('hidden', !isRecurring);
        if (isRecurring && successEls.txnText) {
            // Build "You will be charged $X every ..." line and place in charged slot
            const fee = state.fundingMethod === 'card' ? state.amount * 0.029 : 0;
            const perInstallment = toDollar(state.amount + fee);
            let cadenceStr = '';
            if (state.cadence === 'monthly') {
                cadenceStr = 'month';
            } else if (state.cadence === 'weekly') {
                const d = state.weeklyStart ? parseLocalDate(state.weeklyStart) : null;
                const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                const weekday = d ? weekdays[d.getDay()] + 's' : 'week';
                cadenceStr = `${state.weeklyInterval || 1} week${(state.weeklyInterval||1)===1?'':'s'} on ${weekday}`;
            } else if (state.cadence === 'semiMonthly') {
                const start = state.recurringStart ? parseLocalDate(state.recurringStart) : null;
                const when = start ? ` starting ${String(start.getMonth()+1).padStart(2,'0')}/${String(start.getDate()).padStart(2,'0')}/${String(start.getFullYear()).toString().slice(-2)}` : '';
                successEls.txnText.textContent = `You will be charged ${perInstallment} every 1st and 15th${when}`;
                successEls.txnText.classList.remove('text-gray-500');
                return;
            }
            const start = state.recurringStart ? parseLocalDate(state.recurringStart) : null;
            const when = start ? ` starting ${String(start.getMonth()+1).padStart(2,'0')}/${String(start.getDate()).padStart(2,'0')}/${String(start.getFullYear()).toString().slice(-2)}` : '';
            successEls.txnText.textContent = `You will be charged ${perInstallment} every ${cadenceStr}${when}`;
            successEls.txnText.classList.remove('text-gray-500');
        }
        if (successEls.txnText) {
            const countText = inPledgeConfirm ? (pledgeConfirmEls.txn ? pledgeConfirmEls.txn.textContent : '1') : (reviewEls.txnCount ? reviewEls.txnCount.textContent : '1');
            const count = parseInt(countText || '1', 10) || 1;
            successEls.txnText.textContent = `This will appear as ${count} transaction${count === 1 ? '' : 's'} in your giving history`;
        }
        if (successEls.overlay) {
            // Hide everything behind; keep overlay dark
            document.querySelector('main')?.classList.add('hidden');
            document.getElementById('siteHeader')?.classList.add('hidden');
            successEls.overlay.classList.remove('hidden');
            successEls.overlay.classList.add('flex');
            isSuccessOpen = true;
        }
        // confetti burst (on our canvas behind the card)
        // Fire after layout to ensure canvas has correct size (rAF twice for reliability)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const fcNow = ensureConfettiReady();
                if (fcNow) fcNow({ particleCount: 160, spread: 80, origin: { x: 0.5, y: 0.2 } });
            });
        });
    }
    reviewEls.donateSubmit && reviewEls.donateSubmit.addEventListener('click', (e) => {
        e.preventDefault();
        const m = document.getElementById('modalStripe');
        if (m && state.fundingMethod === 'card') { m.classList.remove('hidden'); m.classList.add('flex'); return; }
        openSuccessModal();
    });
    // Defensive: delegate in case the button is re-rendered
    document.addEventListener('click', (e) => {
        const btn = e.target && e.target.closest && e.target.closest('#donateSubmit');
        if (btn) {
            e.preventDefault();
            const m = document.getElementById('modalStripe');
            if (m && state.fundingMethod === 'card') { m.classList.remove('hidden'); m.classList.add('flex'); return; }
            openSuccessModal();
        }
    });
    successEls.close && successEls.close.addEventListener('click', () => {
        if (successEls.overlay) {
            successEls.overlay.classList.add('hidden');
            successEls.overlay.classList.remove('flex');
        }
        isSuccessOpen = false;
        // Return to start screen with cleared state
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.classList.remove('hidden');
        const headerEl = document.getElementById('siteHeader');
        if (headerEl) headerEl.classList.add('hidden');
        // Reset all state
        resetAllState();
        show('start');
        recomputeSummary();
    });

	Array.from(document.querySelectorAll('input[name="cadence"]')).forEach((input) => {
		input.addEventListener('change', () => {
			state.cadence = input.value;
			recomputeSummary();
		});
	});

    inputs.monthlyDay && inputs.monthlyDay.addEventListener('change', () => {
        state.monthlyDay = parseInt(inputs.monthlyDay.value, 10);
        recomputeSummary();
    });
    inputs.weeklyInterval && inputs.weeklyInterval.addEventListener('change', () => {
        state.weeklyInterval = parseInt(inputs.weeklyInterval.value, 10) || 1;
        recomputeSummary();
    });
	inputs.weeklyStart.addEventListener('change', () => {
		state.weeklyStart = inputs.weeklyStart.value || null;
		recomputeSummary();
	});
summary.employerCoversFee && summary.employerCoversFee.addEventListener('change', () => {
    state.employerCoversFee = summary.employerCoversFee.checked;
    recomputeSummary();
});

    buttons.recurringContinue && buttons.recurringContinue.addEventListener('click', () => {
        // Route to funding selection for recurring
        show('oneTimeFunding');
        header && header.classList.remove('hidden');
        renderFunding();
        updateProgressBar();
    });

    buttons.oneTimeContinue && buttons.oneTimeContinue.addEventListener('click', () => {
		confirmEls.amount.textContent = toDollar(state.amount);
		confirmEls.cadence.textContent = 'One-time';
		confirmEls.fee.textContent = toDollar(feeFor(Math.max(0, state.amount - (state.otCreditsApplied||0))));
		confirmEls.total.textContent = toDollar(Math.max(0, state.amount - (state.otCreditsApplied||0)) + feeFor(Math.max(0, state.amount - (state.otCreditsApplied||0))));
		show('confirmation');
		recomputeSummary();
	});

    buttons.confirmDone.addEventListener('click', () => {
		show('start');
		// reset all state
		resetAllState();
		if (summary.employerCoversFee) summary.employerCoversFee.checked = false;
		recomputeSummary();
	});

    // Initial
	show('start');
	recomputeSummary();
    updateProgressBar();
    isInitialRendered = true;
    window.addEventListener('resize', positionLeftMatchCard);
    window.addEventListener('scroll', positionLeftMatchCard, { passive: true });

    // Recurring helpers
    function initRecurringDefaults() {
        // default start date is tomorrow
        const d = new Date(); d.setDate(d.getDate() + 1);
        const iso = d.toISOString().slice(0,10);
        state.recurringStart = iso;
        inputs.recurringStart && (inputs.recurringStart.value = iso);
        // no default selection per spec; keep UI hidden until user selects a preset
        const preset = document.getElementById('recurrencePreset');
        preset && (preset.value = '');
        toggleRecurrenceUi('');
        // match default mirrors pledge when amount is set via chips/custom
        state.matchPerInstallment = state.amount > 0 ? state.amount : 0;
        const rm = document.getElementById('recurringMatchInput');
        if (rm) rm.value = (state.matchPerInstallment || 0).toFixed(2);
        setupRecurringUiWiring();
    }

    function setupRecurringUiWiring() {
        // Recurrence preset handling
        inputs.recurrencePreset && inputs.recurrencePreset.addEventListener('change', () => {
            const val = inputs.recurrencePreset.value;
            if (val === 'monthly') {
                state.cadence = 'monthly';
            } else if (val === 'weekly2') {
                state.cadence = 'weekly';
                state.weeklyInterval = 2;
            } else if (val === 'semiMonthly') {
                state.cadence = 'semiMonthly';
            } else if (val === 'customWeekly') {
                state.cadence = 'weekly';
                state.weeklyInterval = parseInt(inputs.customWeeklyInterval?.value || '1', 10);
            }
            toggleRecurrenceUi(val);
            // For semi-monthly, auto-select the nearest upcoming 1st or 15th in the start date picker
            if (val === 'semiMonthly') {
                const today = new Date();
                // Use local date; pick strictly in the future
                const day = today.getDate();
                let target = new Date(today);
                if (day < 1) {
                    target.setDate(1);
                } else if (day < 15) {
                    target.setDate(15);
                } else {
                    // move to next month's 1st
                    target.setMonth(target.getMonth() + 1);
                    target.setDate(1);
                }
                // If target is today (edge case), push to 15th of current month or 1st of next
                if (target.toDateString() === today.toDateString()) {
                    if (day === 1) {
                        target.setDate(15);
                    } else {
                        target.setMonth(target.getMonth() + 1);
                        target.setDate(1);
                    }
                }
                const iso = new Date(target.getTime() - target.getTimezoneOffset()*60000).toISOString().slice(0,10);
                state.recurringStart = iso;
                if (inputs.recurringStart) inputs.recurringStart.value = iso;
                // Update the blue monthly summary snippet immediately
                const monthlySummary = document.getElementById('monthlySummary');
                if (monthlySummary) {
                    const mm = String(target.getMonth()+1).padStart(2,'0');
                    const dd = String(target.getDate()).padStart(2,'0');
                    const yy = String(target.getFullYear()).toString().slice(-2);
                    monthlySummary.textContent = `Repeats monthly on the 1st and 15th, starting ${mm}/${dd}/${yy}`;
                    monthlySummary.classList.remove('hidden');
                }
            }
            // Hide any prior blue summaries until a new date is selected
            const monthlySummary = document.getElementById('monthlySummary');
            const weeklySummary = document.getElementById('weeklySummary');
            monthlySummary && monthlySummary.classList.add('hidden');
            weeklySummary && weeklySummary.classList.add('hidden');
            projectAndRenderProgram();
            recomputeSummary();
            validateRecurring();
        });
        inputs.customWeeklyInterval && inputs.customWeeklyInterval.addEventListener('change', () => {
            if (state.cadence === 'weekly') {
                state.weeklyInterval = parseInt(inputs.customWeeklyInterval.value || '1', 10);
                // Update summary for custom preset if start chosen
                const presetVal = inputs.recurrencePreset ? inputs.recurrencePreset.value : '';
                const weeklySummary = document.getElementById('weeklySummary');
                if (weeklySummary && presetVal === 'customWeekly' && state.weeklyStart) {
                    const d = new Date(state.weeklyStart);
                    const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                    const weekday = weekdays[d.getDay()] + 's';
                    const mm = String(d.getMonth()+1).padStart(2,'0');
                    const dd = String(d.getDate()).padStart(2,'0');
                    const yy = String(d.getFullYear()).toString().slice(-2);
                    const n = state.weeklyInterval || 1;
                    weeklySummary.textContent = `Repeats every ${n} week${n===1?'':'s'} on ${weekday}, starting ${mm}/${dd}/${yy}`;
                    weeklySummary.classList.remove('hidden');
                }
                projectAndRenderProgram();
            }
        });
        // Start date change handling for presets with summaries
        inputs.recurringStart && inputs.recurringStart.addEventListener('change', () => {
            state.recurringStart = inputs.recurringStart.value || null;
            const presetVal = inputs.recurrencePreset ? inputs.recurrencePreset.value : '';
            if (presetVal === 'monthly' && state.recurringStart) {
                const d = parseLocalDate(state.recurringStart);
                const day = d.getDate();
                state.monthlyDay = day;
                const ord = (n)=>{const s=['th','st','nd','rd'], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]);};
                const monthlySummary = document.getElementById('monthlySummary');
                if (monthlySummary) {
                    monthlySummary.textContent = `Repeats every month on the ${ord(day)}`;
                    monthlySummary.classList.remove('hidden');
                }
            } else if (presetVal === 'semiMonthly' && state.recurringStart) {
                const d = parseLocalDate(state.recurringStart);
                const mm = String(d.getMonth()+1).padStart(2,'0');
                const dd = String(d.getDate()).padStart(2,'0');
                const yy = String(d.getFullYear()).toString().slice(-2);
                const monthlySummary = document.getElementById('monthlySummary');
                if (monthlySummary) {
                    monthlySummary.textContent = `Repeats monthly on the 1st and 15th, starting ${mm}/${dd}/${yy}`;
                    monthlySummary.classList.remove('hidden');
                }
            }
            validateRecurring(); projectAndRenderProgram();
        });
        // Weekly start selection summary (for every 2 weeks and custom weekly)
        inputs.weeklyStart && inputs.weeklyStart.addEventListener('change', () => {
            state.weeklyStart = inputs.weeklyStart.value || null;
            const weeklySummary = document.getElementById('weeklySummary');
            const presetVal = inputs.recurrencePreset ? inputs.recurrencePreset.value : '';
            if (weeklySummary && state.weeklyStart && (presetVal === 'weekly2' || presetVal === 'customWeekly')) {
                const d = parseLocalDate(state.weeklyStart);
                const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                const weekday = weekdays[d.getDay()] + 's';
                const mm = String(d.getMonth()+1).padStart(2,'0');
                const dd = String(d.getDate()).padStart(2,'0');
                const yy = String(d.getFullYear()).toString().slice(-2);
                if (presetVal === 'weekly2') {
                    weeklySummary.textContent = `Every 2 weeks on ${weekday} starting ${mm}/${dd}/${yy}`;
                } else {
                    const n = parseInt(inputs.customWeeklyInterval?.value || '1', 10);
                    weeklySummary.textContent = `Repeats every ${n} week${n===1?'':'s'} on ${weekday}, starting ${mm}/${dd}/${yy}`;
                }
                weeklySummary.classList.remove('hidden');
            }
            projectAndRenderProgram();
            recomputeSummary();
        });
        // End type toggle
        Array.from(document.querySelectorAll('input[name="endType"]')).forEach((input) => {
            input.addEventListener('change', () => {
                state.endType = input.value;
                const end = inputs.recurringEnd;
                if (end) end.classList.toggle('hidden', state.endType !== 'onDate');
                recomputeSummary();
                projectAndRenderProgram();
                validateRecurring();
            });
        });
        // end select behavior
        inputs.endSelect && inputs.endSelect.addEventListener('change', () => {
            const val = inputs.endSelect.value;
            state.endType = val || 'none';
            const endWrap = document.getElementById('endDateWrap');
            const help = inputs.endHelp;
            if (help) {
                if (val === 'none') help.textContent = "Will renew with your company's match program";
                else if (val === 'untilMatch') help.textContent = 'This donation will run until your matching program ends or funds are depleted';
                else if (val === 'onDate') help.textContent = 'Choose a date';
                else help.textContent = '';
            }
            if (endWrap) endWrap.classList.toggle('hidden', val !== 'onDate');
            validateRecurring();
            // Refresh cadence snippets when end option changes
            recomputeSummary();
            if (state.view === 'oneTimeFunding') renderFunding();
            if (state.view === 'oneTimePledgeConfirm') renderPledgeConfirm();
        });
        inputs.recurringEnd && inputs.recurringEnd.addEventListener('change', () => {
            state.recurringEnd = inputs.recurringEnd.value || null;
            validateRecurring(); projectAndRenderProgram();
            // Refresh cadence snippets when end date changes
            recomputeSummary();
            if (state.view === 'oneTimeFunding') renderFunding();
            if (state.view === 'oneTimePledgeConfirm') renderPledgeConfirm();
        });
        // Recurring match edit
        const display = document.getElementById('recurringMatchDisplay');
        const displayText = document.getElementById('recurringMatchDisplayText');
        const inputGroup = document.getElementById('recurringMatchInputGroup');
        const input = document.getElementById('recurringMatchInput');
        const editBtn = document.getElementById('recurringEditMatchBtn');
        function updateDisplay() {
            if (!display || !displayText) return;
            const pledge = state.amount || 0;
            if (pledge > 0) {
                display.classList.remove('hidden');
                displayText.textContent = `${toDollar(Math.min(state.matchPerInstallment || 0, pledge))} will be matched each installment`;
            } else {
                display.classList.add('hidden');
                inputGroup && inputGroup.classList.add('hidden');
            }
        }
        window.updateRecurringMatchUi = updateDisplay;
        // Match edit UX exactly like one-time
        editBtn && editBtn.addEventListener('click', () => {
            // keep display visible above while editing
            inputGroup && inputGroup.classList.remove('hidden');
            input && input.focus();
        });
        input && input.addEventListener('input', () => {
            const pledge = state.amount || 0;
            let val = parseFloat(input.value);
            if (isNaN(val) || val < 0) val = 0;
            if (val > pledge) val = pledge;
            input.value = val.toFixed(2);
            state.matchPerInstallment = val;
            projectAndRenderProgram();
            recomputeSummary();
        });
        input && input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                inputGroup && inputGroup.classList.add('hidden');
                updateDisplay();
            }
        });
        updateDisplay();
        projectAndRenderProgram();
    }

    function validateRecurring() {
        // $5 minimum
        const hasPledge = (state.amount || 0) >= 5;
        inputs.amountError && inputs.amountError.classList.toggle('hidden', hasPledge);
        // start date in future (weekly uses weeklyStart; others use recurringStart)
        const startErr = document.getElementById('startDateError');
        let startOk = true;
        if (state.cadence === 'weekly') {
            const v = inputs.weeklyStart ? inputs.weeklyStart.value : '';
            if (v) {
                const today = new Date(); today.setHours(0,0,0,0);
                const s = parseLocalDate(v);
                startOk = s && s.getTime() > today.getTime();
            } else { startOk = false; }
        } else {
            if (state.recurringStart) {
                const today = new Date(); today.setHours(0,0,0,0);
                const s = parseLocalDate(state.recurringStart);
                startOk = s && s.getTime() > today.getTime();
            } else { startOk = false; }
        }
        startErr && startErr.classList.toggle('hidden', !!startOk);
        // end date after start when selected
        const endErr = document.getElementById('endDateError');
        let endOk = true;
        if (state.endType === 'onDate' && state.recurringEnd && state.recurringStart) {
            endOk = new Date(state.recurringEnd).getTime() > new Date(state.recurringStart).getTime();
        }
        endErr && endErr.classList.toggle('hidden', !!endOk);
        // cadence chosen and end option chosen (dropdown)
        const cadenceChosen = !!state.cadence;
        let endChosen = true;
        if (inputs.endSelect) endChosen = !!inputs.endSelect.value;
        // enable header CTA when valid
        const canProceed = hasPledge && startOk && endOk && cadenceChosen && endChosen;
        if (buttons.checkout) buttons.checkout.disabled = !canProceed;
        const sideBtn = document.getElementById('checkoutBtnSide');
        sideBtn && (sideBtn.disabled = !canProceed);
    }

    function projectAndRenderProgram() {
        const pledge = state.amount || 0;
        const match = Math.min(state.matchPerInstallment || pledge, pledge);
        // default match mirrors pledge if not edited
        if (!state.matchEdited && (state.matchPerInstallment || 0) === 0) state.matchPerInstallment = match;
        const cap = state.program.capTotal;
        const used = state.program.usedToDate;
        const remaining = Math.max(0, cap - used);
        const expires = new Date(state.program.expiresAt);
        // Estimate number of installments until expiry and per end option
        const start = state.recurringStart ? parseLocalDate(state.recurringStart) : todayLocal();
        function nextDate(date) {
            const d = new Date(date);
            if (state.cadence === 'weekly') {
                d.setDate(d.getDate() + 7 * (state.weeklyInterval || 1));
            } else if (state.cadence === 'semiMonthly') {
                const day = d.getDate();
                if (day < 15) d.setDate(15); else { d.setMonth(d.getMonth() + 1); d.setDate(1); }
            } else { // monthly
                const next = new Date(d);
                next.setMonth(next.getMonth() + 1);
                const target = state.monthlyDay || 1;
                next.setDate(1);
                const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
                next.setDate(Math.min(target, last));
                return next;
            }
            return d;
        }
        // figure first installment date for weekly/semiMonthly based on inputs
        let first = new Date(start);
        if (state.cadence === 'weekly' && inputs.weeklyStart && inputs.weeklyStart.value) {
            first = parseLocalDate(inputs.weeklyStart.value) || first;
        }
        if (state.cadence === 'monthly') {
            const target = state.monthlyDay || 1;
            const m = new Date(first); m.setDate(1);
            const last = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
            m.setDate(Math.min(target, last));
            if (m <= first) {
                // advance to next month if today is past target
                m.setMonth(m.getMonth() + 1);
                const last2 = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
                m.setDate(Math.min(target, last2));
            }
            first = m;
        }
        if (state.cadence === 'semiMonthly') {
            const day = first.getDate();
            if (day >= 15) { first.setMonth(first.getMonth() + 1); first.setDate(1); }
            else first.setDate(15);
        }
        // count installment slots until expiry/end (ignore cap here)
        let installments = 0;
        let cursor = new Date(first);
        const endDate = state.endType === 'onDate' && state.recurringEnd ? parseLocalDate(state.recurringEnd) : null;
        while (cursor <= expires && (!endDate || cursor <= endDate)) {
            installments++;
            const next = nextDate(cursor);
            if (!next || next.getTime() === cursor.getTime()) break;
            cursor = next;
        }
        // If endType is untilMatch, auto-derive end date to the last matched installment date
        if (state.endType === 'untilMatch') {
            const endDerived = new Date(first);
            for (let i = 1; i < installments; i++) endDerived.setTime(nextDate(endDerived).getTime());
            inputs.recurringEnd && (inputs.recurringEnd.value = '');
            state.recurringEnd = null;
        }
        // Update program card UI
        const availableEl = document.getElementById('programAvailableLabel');
        const usedBar = document.getElementById('programUsedBar');
        const projectedBar = document.getElementById('programProjectedBar');
        const usedText = document.getElementById('programUsedText');
        const capText = document.getElementById('programCapText');
        const capText2 = document.getElementById('programCapText2');
        const expiresText = document.getElementById('programExpiresText');
        const projectedText = document.getElementById('programProjectedText');
        const projectedRow = document.getElementById('programProjectedRow');
        availableEl && (availableEl.textContent = toDollar(remaining));
        usedText && (usedText.textContent = toDollarWholeCeil(used));
        capText && (capText.textContent = toDollarWholeCeil(cap));
        capText2 && (capText2.textContent = toDollarWholeCeil(cap));
        expiresText && (expiresText.textContent = new Date(state.program.expiresAt).toLocaleDateString());
        const projectedVal = Math.max(0, Math.min(remaining, installments * match));
        // Always compute projection relative to used; yellow shows total (used + projected)
        const totalWithProjection = Math.min(cap, used + projectedVal);
        const shouldShowProjection = (state.amount || 0) > 0 && !!state.cadence;
        if (projectedRow) projectedRow.classList.toggle('hidden', !shouldShowProjection);
        if (projectedText) projectedText.textContent = toDollarWholeCeil(projectedVal);
        if (usedBar) {
            const pctUsed = Math.min(100, Math.round((used / cap) * 100));
            usedBar.style.width = pctUsed + '%';
        }
        if (projectedBar) {
            if (shouldShowProjection) {
                const pctTotal = Math.min(100, Math.round((totalWithProjection / cap) * 100));
                projectedBar.style.width = pctTotal + '%';
                projectedBar.classList.remove('hidden');
            } else {
                projectedBar.classList.add('hidden');
            }
        }
    }

    // Toggle recurrence preset specific UI blocks
    function toggleRecurrenceUi(preset) {
        const monthlyOpts = document.getElementById('monthlyOptions');
        const weeklyOpts = document.getElementById('weeklyOptions');
        const customWrap = document.getElementById('customWeeklyWrap');
        const generalStart = document.getElementById('generalStartBlock');
        const weeklySummary = document.getElementById('weeklySummary');
        const monthlySummary = document.getElementById('monthlySummary');
        if (!preset) {
            monthlyOpts && monthlyOpts.classList.add('hidden');
            weeklyOpts && weeklyOpts.classList.add('hidden');
            customWrap && customWrap.classList.add('hidden');
            generalStart && generalStart.classList.add('hidden');
            weeklySummary && weeklySummary.classList.add('hidden');
            monthlySummary && monthlySummary.classList.add('hidden');
        } else if (preset === 'monthly') {
            monthlyOpts && monthlyOpts.classList.remove('hidden');
            weeklyOpts && weeklyOpts.classList.add('hidden');
            customWrap && customWrap.classList.add('hidden');
            generalStart && generalStart.classList.remove('hidden');
            weeklySummary && weeklySummary.classList.add('hidden');
            monthlySummary && monthlySummary.classList.add('hidden');
        } else if (preset === 'weekly2') {
            weeklyOpts && weeklyOpts.classList.remove('hidden');
            monthlyOpts && monthlyOpts.classList.add('hidden');
            customWrap && customWrap.classList.add('hidden');
            state.weeklyInterval = 2;
            generalStart && generalStart.classList.add('hidden');
            weeklySummary && weeklySummary.classList.add('hidden');
            monthlySummary && monthlySummary.classList.add('hidden');
        } else if (preset === 'semiMonthly') {
            monthlyOpts && monthlyOpts.classList.add('hidden');
            weeklyOpts && weeklyOpts.classList.add('hidden');
            customWrap && customWrap.classList.add('hidden');
            generalStart && generalStart.classList.remove('hidden');
            weeklySummary && weeklySummary.classList.add('hidden');
            monthlySummary && monthlySummary.classList.add('hidden');
        } else if (preset === 'customWeekly') {
            weeklyOpts && weeklyOpts.classList.remove('hidden');
            monthlyOpts && monthlyOpts.classList.add('hidden');
            customWrap && customWrap.classList.remove('hidden');
            generalStart && generalStart.classList.add('hidden');
            weeklySummary && weeklySummary.classList.add('hidden');
            monthlySummary && monthlySummary.classList.add('hidden');
        }
    }
})();


