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
  border-radius: 12px;
  padding: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #fff;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #444;
  border-radius: 4px;
  background: #2c2c2c;
  color: #fff;
  font-size: 0.9rem;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 1.5rem;
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
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  max-width: 95%;
  margin-left: auto;
  margin-right: auto;
`;

const ItemInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 200px;
`;

const ItemDetails = styled.div`
  margin-top: 5px;
  padding-top: 0;
  border-top: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 0.9em;
  color: #ccc;
  flex: 1;
  min-width: 200px;
`;

const ItemActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 10px;
  flex: 1;
  min-width: 150px;
`;

const Button = styled.button<{ variant?: 'delete' }>`
  padding: 5px 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background: ${props => props.variant === 'delete' ? '#E94560' : '#2c2c2c'};
  color: white;
  margin-left: 5px;

  &:hover {
    opacity: 0.9;
  }
`;

const Badge = styled.span`
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #fff;
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
  const [sortBy, setSortBy] = useState<'dueDate' | 'creditCard' | 'amount' | 'tags'>('dueDate');
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
      case 'dueDate':
        const dateA = getNextDueDate(a);
        const dateB = getNextDueDate(b);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1; // null dates come last
        if (!dateB) return -1;
        // Use non-null assertion as we've checked both values are not null
        return dateA!.getTime() - dateB!.getTime();
      case 'creditCard':
        return (a.account || '').localeCompare(b.account || '');
      case 'amount':
        return b.amount - a.amount;
      case 'tags':
        const aTags = a.tags?.join('') || '';
        const bTags = b.tags?.join('') || '';
        return aTags.localeCompare(bTags);
      default:
        return 0;
    }
  });

  return (
    <Container>
      <Header>
        <Title>Subscriptions List</Title>
        <Controls>
          <label htmlFor="sort-select">Sort by: </label>
          <Select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="dueDate">Due Date</option>
            <option value="creditCard">Credit Card</option>
            <option value="amount">Amount</option>
            <option value="tags">Tags</option>
          </Select>
        </Controls>
      </Header>
      
      {allTags.length > 0 && (
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
                backgroundColor: '#333',
                color: '#fff',
                transition: 'all 0.2s ease',
                boxShadow: 'none',
              }}
              onClick={() => setTagFilters([])}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.backgroundColor = '#444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.backgroundColor = '#333';
              }}
            >
              <Icon icon="mdi:close" style={{ marginRight: '4px' }} />
              Clear All
            </Badge>
          )}
          {allTags.map((tag, index) => (
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
                backgroundColor: tagFilters.includes(tag) 
                  ? 'rgba(255, 140, 0, 0.8)' 
                  : 'rgba(255, 140, 0, 0.2)',
                color: tagFilters.includes(tag) ? '#fff' : '#FF8C00',
                fontWeight: tagFilters.includes(tag) ? 'bold' : 'normal',
                transition: 'all 0.2s ease',
                boxShadow: 'none',
              }}
              onClick={() => handleTagClick(tag)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                if (!tagFilters.includes(tag)) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 140, 0, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
                if (!tagFilters.includes(tag)) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 140, 0, 0.2)';
                }
              }}
            >
              {tag}
            </Badge>
          ))}
        </TagsContainer>
      )}
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
                        width: '12px',
                        height: '12px',
                        cursor: 'pointer',
                        appearance: 'none',
                        outline: 'none',
                        border: '2px solid #03DAC6',
                        borderRadius: '50%',
                        backgroundColor: sub.included ? '#03DAC6' : 'transparent',
                      }}
                    />
                  </div>
                  <Icon
                    icon={`mdi:${sub.icon}`}
                    style={{ color: sub.color, fontSize: '1.5em' }}
                  />
                  <div>
                    <p style={{ 
                      fontSize: '1.2em', 
                      margin: 0, 
                      color: '#fff',
                      wordWrap: 'break-word',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '200px'
                    }}>{sub.name}</p>
                    <p style={{ fontSize: '0.8em', margin: 0, color: '#adadad' }}>
                      {formatCurrency(sub.amount, sub.currency)}/{sub.intervalValue} {sub.intervalUnit}
                    </p>
                  </div>
                </ItemInfo>
                <ItemDetails>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '5px' }}>
                    <Icon icon="mdi:credit-card" style={{ marginRight: '5px', color: '#45B7D1' }} />
                    <span style={{ color: '#ccc' }}>{sub.account || 'Not Specified'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginTop: '5px' }}>
                    <Badge style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.8em',
                      margin: '2px 5px 2px 0',
                      whiteSpace: 'nowrap',
                      height: '24px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      order: -1
                    }}>
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
                      <Badge style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8em',
                        margin: '2px 5px 2px 0',
                        whiteSpace: 'nowrap',
                        height: '24px',
                        backgroundColor: 'rgba(69, 183, 209, 0.2)',
                        color: '#45B7D1'
                      }}>
                        <Icon icon="mdi:auto-pay" style={{ marginRight: '3px' }} />
                        Autopay
                      </Badge>
                    )}
                    {Boolean(sub.notify) && (
                      <Badge style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8em',
                        margin: '2px 5px 2px 0',
                        whiteSpace: 'nowrap',
                        height: '24px',
                        backgroundColor: 'rgba(255, 253, 107, 0.2)',
                        color: '#fffd6b'
                      }}>
                        <Icon icon="mdi:bell" style={{ marginRight: '3px' }} />
                        Notify
                      </Badge>
                    )}
                  </div>
                  {sub.tags && sub.tags.length > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      marginTop: '4px', 
                      width: '100%' 
                    }}>
                      {sub.tags.map((tag, index) => (
                        <Badge 
                          key={index}
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            fontSize: '0.7em',
                            margin: '2px 4px 2px 0',
                            whiteSpace: 'nowrap',
                            height: '18px',
                            backgroundColor: 'rgba(255, 140, 0, 0.2)',
                            color: '#FF8C00'
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </ItemDetails>
                <ItemActions>
                  <Button onClick={() => onEdit(sub)}>Edit</Button>
                  <Button variant="delete" onClick={() => onDelete(sub.id!)}>
                    Delete
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