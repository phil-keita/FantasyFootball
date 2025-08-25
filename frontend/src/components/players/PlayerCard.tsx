import { useDraftStore, Player } from '../../store/draftStore'
import { Users, TrendingUp } from 'lucide-react'

interface PlayerCardProps {
  player: Player
  showDraftButton?: boolean
}

export const PlayerCard = ({ player, showDraftButton = false }: PlayerCardProps) => {
  const { draftPlayer, isUserTurn } = useDraftStore()

  const handleDraft = () => {
    if (!player.isDrafted) {
      draftPlayer(player.id)
    }
  }

  const getPositionColor = (position: string) => {
    const colors = {
      QB: 'bg-blue-100 text-blue-800',
      RB: 'bg-green-100 text-green-800',
      WR: 'bg-purple-100 text-purple-800',
      TE: 'bg-orange-100 text-orange-800',
      K: 'bg-yellow-100 text-yellow-800',
      DEF: 'bg-red-100 text-red-800'
    }
    return colors[position as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className={`player-card ${player.isDrafted ? 'drafted' : 'available'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`position-badge ${player.position} ${getPositionColor(player.position)} px-2 py-1 rounded-full text-xs font-medium`}>
              {player.position}
            </span>
            <span className="text-xs text-gray-500">{player.team}</span>
          </div>
          
          <h3 className="font-semibold text-gray-900 truncate">{player.name}</h3>
          
          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
            {player.adp && (
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>ADP: {player.adp}</span>
              </div>
            )}
            {player.projectedPoints && (
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3" />
                <span>{player.projectedPoints}</span>
              </div>
            )}
          </div>

          {player.tier && (
            <div className="mt-1 text-xs text-gray-500">
              Tier {player.tier}
            </div>
          )}
        </div>
      </div>

      {player.isDrafted && (
        <div className="mt-2 text-xs text-gray-500">
          Drafted by {player.draftedBy} • Round {player.draftRound}, Pick {player.draftPosition}
        </div>
      )}

      {showDraftButton && !player.isDrafted && isUserTurn && (
        <button
          onClick={handleDraft}
          className="mt-3 w-full bg-primary-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
        >
          Draft Player
        </button>
      )}
    </div>
  )
}
