'use client';

import { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify-icon/react';
import getSymbolFromCurrency from 'currency-symbol-map';
import { parseISO, addDays, addWeeks, addMonths, addYears, format } from 'date-fns';
import { Subscription } from '@/types';

const Container = styled.div`
  background: transparent;
  border-radius: 0;
  padding: 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  width: 100%;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Select = styled.select`
  padding: 0.5rem 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  background: rgba(30, 30, 45, 0.4);
  color: #fff;
  font-size: 0.9rem;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  
  option {
    background-color: rgba(30, 30, 45, 0.8);
    color: white;
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  flex: 1;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ListContainer = styled.div<{ $maxHeight: string }>`
  max-height: ${props => props.$maxHeight};
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
`;

const Item = styled(motion.li)`
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0;
  padding: 10px 5px;
  margin-bottom: 0;
  background: transparent;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
  transition: all 0.4s ease;
  gap: 10px;
  
  &:hover {
    transform: translateY(-3px);
    background-color: rgba(255, 255, 255, 0.05);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ItemInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex: 0 0 auto;
  min-width: 180px;
  max-width: 30%;
`;

const ItemDetails = styled.div`
  margin-top: 3px;
  padding-top: 0;
  border-top: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 0.85em;
  color: rgba(255, 255, 255, 0.9);
  flex: 1 1 auto;
  margin-left: 0;
  min-width: 180px;
`;

const ItemActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0;
  flex: 0 0 auto;
  min-width: auto;
  margin-left: auto;
`;

const Button = styled.button<{ variant?: 'delete' }>`
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  cursor: pointer;
  background: ${props => props.variant === 'delete' ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  color: ${props => props.variant === 'delete' ? 'rgba(255, 255, 255, 0.9)' : 'white'};
  margin-left: 5px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
`;

const Badge = styled.span`
  background: transparent;
  padding: 1px 6px;
  border-radius: 6px;
  font-size: 0.7rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  margin: 0 4px 0 0;
  height: 18px;
  white-space: nowrap;
`;

interface Props {
  subscriptions: Subscription[];
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: number) => void;
  onToggleInclude: (id: number) => void;
  showCurrencySymbol: boolean;
  onFilteredSubscriptionsChange?: (filteredSubscriptions: Subscription[]) => void;
  onTagFilterChange?: (tags: string[]) => void;
  maxHeight?: string;
}

function getNextDueDate(subscription: Subscription): Date | null {
  // Try due_date if dueDate is not available
  const dueDateValue = subscription.dueDate || subscription.due_date;
  
  if (!dueDateValue) {
    return null;
  }
  
  const today = new Date();
  let dueDate = parseISO(dueDateValue);
  const intervalValue = subscription.intervalValue ?? 1;
  const intervalUnit = subscription.intervalUnit ?? 'months';

  while (dueDate <= today) {
    switch (intervalUnit) {
      case 'days':
        dueDate = addDays(dueDate, intervalValue);
        break;
      case 'weeks':
        dueDate = addWeeks(dueDate, intervalValue);
        break;
      case 'months':
        dueDate = addMonths(dueDate, intervalValue);
        break;
      case 'years':
        dueDate = addYears(dueDate, intervalValue);
        break;
      default:
        return dueDate;
    }
  }

  return dueDate;
}

export default function SubscriptionList({
  subscriptions,
  onEdit,
  onDelete,
  onToggleInclude,
  showCurrencySymbol,
  onFilteredSubscriptionsChange,
  onTagFilterChange,
  maxHeight = '400px'
}: Props) {
  const [sortBy, setSortBy] = useState<'name' | 'dueDate' | 'amount'>('dueDate');
  const [tagFilters, setTagFilters] = useState<string[]>([]);

  const formatCurrency = (amount: number, currencyCode: string): string => {
    const code = currencyCode || 'USD';
    
    if (showCurrencySymbol) {
      const symbol = getSymbolFromCurrency(code) || '$';
      return `${symbol}${amount.toFixed(2)}`;
    } else {
      return `${amount.toFixed(2)} ${code}`;
    }
  };

  // Get all unique tags from subscriptions
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    subscriptions.forEach(sub => {
      if (sub.tags && sub.tags.length > 0) {
        sub.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [subscriptions]);

  // Toggle tag selection
  const handleTagClick = (tag: string) => {
    setTagFilters(prevTags => {
      if (prevTags.includes(tag)) {
        return prevTags.filter(t => t !== tag);
      } else {
        return [...prevTags, tag];
      }
    });
  };

  // Filter subscriptions by tags
  const filteredSubscriptions = tagFilters.length > 0
    ? subscriptions.filter(sub => 
        sub.tags && sub.tags.some(tag => tagFilters.includes(tag))
      )
    : subscriptions;

  // Notify parent about filtered subscriptions
  useEffect(() => {
    if (onFilteredSubscriptionsChange) {
      onFilteredSubscriptionsChange(filteredSubscriptions);
    }
    if (onTagFilterChange) {
      onTagFilterChange(tagFilters);
    }
  }, [filteredSubscriptions, onFilteredSubscriptionsChange, tagFilters, onTagFilterChange]);

  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'dueDate':
        const dateA = getNextDueDate(a);
        const dateB = getNextDueDate(b);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1; // null dates come last
        if (!dateB) return -1;
        // Use non-null assertion as we've checked both values are not null
        return dateA!.getTime() - dateB!.getTime();
      case 'amount':
        return b.amount - a.amount;
      default:
        return 0;
    }
  });

  return (
    <Container>
      <Header>
        <TagsContainer>
          {tagFilters.length > 0 && (
            <Badge 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center',
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '0.8em',
                margin: '2px 8px 2px 0',
                cursor: 'pointer',
                background: 'transparent',
                color: 'rgba(255, 255, 255, 0.9)',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
              onClick={() => setTagFilters([])}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.18)';
              }}
            >
              <Icon icon="mdi:close" style={{ marginRight: '4px' }} />
              Clear All
            </Badge>
          )}
          {allTags.length > 0 && allTags.map((tag, index) => (
            <Badge 
              key={index}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center',
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '0.8em',
                margin: '2px 4px 2px 0',
                cursor: 'pointer',
                background: 'transparent',
                color: tagFilters.includes(tag) ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.9)',
                fontWeight: tagFilters.includes(tag) ? 'bold' : 'normal',
                transition: 'all 0.3s ease',
                border: tagFilters.includes(tag) 
                  ? '1px solid rgba(255, 255, 255, 0.5)' 
                  : '1px solid rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: tagFilters.includes(tag) 
                  ? '0 0 15px rgba(255, 255, 255, 0.2)' 
                  : 'none',
              }}
              onClick={() => handleTagClick(tag)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.border = tagFilters.includes(tag)
                  ? '1px solid rgba(255, 255, 255, 0.7)'
                  : '1px solid rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = tagFilters.includes(tag) 
                  ? '0 0 15px rgba(255, 255, 255, 0.2)' 
                  : 'none';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.border = tagFilters.includes(tag)
                  ? '1px solid rgba(255, 255, 255, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.18)';
              }}
            >
              {tag}
            </Badge>
          ))}
        </TagsContainer>
        <Controls>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <option value="name">Name</option>
            <option value="amount">Amount</option>
            <option value="dueDate">Due Date</option>
          </Select>
        </Controls>
      </Header>
      
      <ListContainer $maxHeight={maxHeight}>
        <List>
          <AnimatePresence>
            {sortedSubscriptions.map((sub) => (
              <Item
                key={sub.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ItemInfo>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="checkbox"
                      checked={sub.included}
                      onChange={() => onToggleInclude(sub.id!)}
                      style={{
                        width: '10px',
                        height: '10px',
                        cursor: 'pointer',
                        appearance: 'none',
                        outline: 'none',
                        border: '2px solid rgba(255, 255, 255, 0.7)',
                        borderRadius: '50%',
                        backgroundColor: sub.included ? 'rgba(255, 255, 255, 0.7)' : 'transparent',
                      }}
                    />
                  </div>
                  <Icon
                    icon={`mdi:${sub.icon}`}
                    style={{ color: sub.color, fontSize: '1.2em' }}
                  />
                  <div>
                    <p style={{ fontSize: '1em', margin: 0, color: 'rgba(255, 255, 255, 0.9)' }}>{sub.name}</p>
                    <p style={{ fontSize: '0.75em', margin: 0, color: 'rgba(255, 255, 255, 0.6)' }}>
                      {formatCurrency(sub.amount, sub.currency)}
                    </p>
                  </div>
                </ItemInfo>
                <ItemDetails>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '3px' }}>
                    <Icon icon="mdi:credit-card" style={{ marginRight: '5px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9em' }} />
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85em' }}>{sub.account || 'Not Specified'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    <Badge style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      {(() => {
                        const nextDueDate = getNextDueDate(sub);
                        if (nextDueDate) {
                          return format(nextDueDate, 'MMM d, yyyy');
                        } else {
                          return 'No due date';
                        }
                      })()}
                    </Badge>
                    {Boolean(sub.autopay) && (
                      <Badge style={{ color: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
                        <Icon icon="mdi:auto-pay" style={{ marginRight: '2px', fontSize: '0.9em' }} />
                        Auto
                      </Badge>
                    )}
                    {Boolean(sub.notify) && (
                      <Badge style={{ color: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
                        <Icon icon="mdi:bell" style={{ marginRight: '2px', fontSize: '0.9em' }} />
                        Notify
                      </Badge>
                    )}
                    {sub.tags && sub.tags.length > 0 && sub.tags.map((tag, index) => (
                      <Badge 
                        key={index}
                        style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          color: 'rgba(255, 255, 255, 0.9)'
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </ItemDetails>
                <ItemActions>
                  <Button onClick={() => onEdit(sub)}>
                    <Icon icon="mdi:pencil" />
                  </Button>
                  <Button variant="delete" onClick={() => onDelete(sub.id!)}>
                    <Icon icon="mdi:trash-can-outline" />
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </AnimatePresence>
        </List>
      </ListContainer>
    </Container>
  );
} 