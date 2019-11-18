const esVoterHistoryDocuments = {
    NC: [
        {
            type: 'third_type',
            countyId: 'county_id',
            countyDesc: 'county_desc',
            voterRegNum: 'voter_reg_num',
            electionLbl: 'election_lbl',
            electionDesc: 'election_desc',
            votingMethod: 'voting_method',
            votedPartyCd: 'voted_party_cd',
            votedPartyDesc: 'voted_party_desc',
            pctLabel: 'pct_label',
            pctDescription: 'pct_description',
            ncid: 'ncid',
            votedCountyId: 'voted_county_id',
            votedCountyDesc: 'voted_county_desc',
            vtdLabel: 'vtd_label',
            vtdDescription: 'vtd_description'
        }
    ],
    WA: [
        {
            type: 'history_washington',
            countyCode: 'CountyCode',
            voterRegNum: 'StateVoterID',
            electionDate: 'ElectionDate',
            votingHistoryID: 'VotingHistoryID'
        },
        {
            type: 'history_washington_2019',
            countyCode: 'CountyCode',
            voterRegNum: 'StateVoterID',
            electionDate: 'ElectionDate',
            voterHistoryID: 'VoterHistoryID'
        }
    ]
}

module.exports = esVoterHistoryDocuments;
